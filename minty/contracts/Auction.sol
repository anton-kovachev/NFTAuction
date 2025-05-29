//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction {
    struct Listing {
        address nftAddress;
        uint256 nftId;
        uint256 minPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        address owner;
    }

    uint256 nextListingId;
    mapping(uint256 => Listing) listings;
    mapping(address => uint256) balances;
    mapping(address => uint256[]) listedByOwner;

    event List(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed nftId,
        uint256 listingId,
        uint256 minPrice,
        uint256 endTime,
        uint256 timestamp
    );

    event Bid(
        address indexed bidder,
        uint256 listingId,
        uint256 bid,
        uint256 timestamp
    );
    modifier listingExists(uint listingId) {
        require(
            listings[listingId].owner != address(0),
            "Listing does not exists."
        );
        _;
    }

    function onERC721Received(
        address operator,
        address from,
        uint tokenId,
        bytes calldata data
    ) public pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function list(
        address nftAddress,
        uint256 nftId,
        uint256 minPrice,
        uint256 numHours
    ) external {
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(nftId) == msg.sender, "You don't own this Nft");
        require(
            nft.getApproved(nftId) == address(this),
            "This contract is not approved to access this Nft"
        );

        nft.safeTransferFrom(msg.sender, address(this), nftId);

        Listing storage listing = listings[nextListingId];
        listing.nftAddress = nftAddress;
        listing.nftId = nftId;
        listing.minPrice = minPrice;
        listing.endTime = block.timestamp + (numHours * 1 hours);
        listing.owner = msg.sender;
        listing.highestBidder = msg.sender;

        emit List(
            msg.sender,
            nftAddress,
            nftId,
            nextListingId,
            minPrice,
            listing.endTime,
            block.timestamp
        );
        listedByOwner[msg.sender].push(nextListingId);
        nextListingId += 1;
    }

    function bid(uint listingId) external payable listingExists(listingId) {
        Listing storage listing = listings[listingId];
        require(
            listing.owner != msg.sender,
            "You can't bid on your own listing."
        );
        require(
            msg.value >= listing.minPrice,
            "You must bid at least at the minimum price."
        );
        require(
            msg.value > listing.highestBid,
            "You must bid higher than the current highest bid."
        );
        require(
            msg.sender != listing.highestBidder,
            "You can't outbid your own highest bid."
        );
        require(
            block.timestamp < listing.endTime,
            "The auction for this nft listing has ended."
        );
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;
        balances[listing.highestBidder] += listing.highestBid;

        emit Bid(msg.sender, listingId, msg.value, block.timestamp);
    }

    function withdrawFunds() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "You don't have deposited balance.");
        balances[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: balance}("");
        require(sent, "Withdraw funds has failed.");
    }

    function getListing(
        uint256 listingId
    )
        public
        view
        listingExists(listingId)
        returns (
            address nftAddress,
            uint256 nftId,
            uint256 highestBid,
            uint256 minPrice,
            uint256 endTime
        )
    {
        Listing memory listing = listings[listingId];
        return (
            listing.nftAddress,
            listing.nftId,
            listing.highestBid,
            listing.minPrice,
            listing.endTime
        );
    }

    function getListedByOwner()
        external
        view
        returns (uint256[] memory listingsByOwner)
    {
        return listedByOwner[msg.sender];
    }

    function getListingToBid()
        external
        view
        returns (uint256[] memory listingsToBid)
    {
        uint256[] memory listingsToBid = new uint256[](
            nextListingId - listedByOwner[msg.sender].length
        );

        uint8 currentListingToBid = 0;
        for (uint8 i = 0; i < nextListingId; i++) {
            bool isListedByOwner = false;
            for (uint8 j = 0; j < listedByOwner[msg.sender].length; j++) {
                if (listedByOwner[msg.sender][j] == i) {
                    isListedByOwner = true;
                }
            }

            if (
                !isListedByOwner &&
                listings[i].endTime > block.timestamp &&
                listings[i].owner != address(0)
            ) {
                listingsToBid[currentListingToBid] = i;
                currentListingToBid += 1;
            }
        }

        return listingsToBid;
    }

    function end(uint256 listingId) external listingExists(listingId) {
        Listing storage listing = listings[listingId];
        require(
            listing.owner == msg.sender,
            "Only the nft owner can end the auction."
        );
        require(
            listing.endTime <= block.timestamp,
            "Auction for this listing is not over yet."
        );
        require(
            balances[listing.highestBidder] >= listing.highestBid,
            "Highest bidder has not enough funds deposited."
        );

        IERC721(listing.nftAddress).safeTransferFrom(
            address(this),
            listing.highestBidder,
            listing.nftId
        );

        balances[listing.highestBidder] -= listing.highestBid;
        (bool sent, ) = payable(listing.owner).call{value: listing.highestBid}(
            ""
        );
        
        require(sent, "End of auction for listing failed.");

        uint256[] storage newListedByOwner;
        for (uint8 i = 0; i < listedByOwner[msg.sender].length; i++) {
            if (listedByOwner[msg.sender][i] != listingId) {
                newListedByOwner.push(listedByOwner[msg.sender][i]);
            }
        }

        listedByOwner[msg.sender] = newListedByOwner;
        listing.owner = address(0);
    }
}
