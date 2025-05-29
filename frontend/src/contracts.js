import { ethers, Contract } from "ethers";

const MINTY_CONTRACT_ADDRESS = "0xab16A69A5a8c12C732e0DEFF4BE56A70bb64c926";
const MINTY_CONTRACT_ABI = [
  "constructor(string tokenName, string symbol)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event NFT_Minted(address owner, uint256 ntfId)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function balanceOf(address owner) view returns (uint256)",
  "function baseURI() view returns (string)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function mintToken(address owner, string metadataURI) returns (uint256)",
  "function name() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId)",
];

const AUCTION_CONTRACT_ADDRESS = "0xE3011A37A904aB90C8881a99BD1F6E21401f1522";
const AUCTION_CONTRACT_ABI = [
  "event Bid(address indexed bidder, uint256 listingId, uint256 bid, uint256 timestamp)",
  "event List(address indexed owner, address indexed nftAddress, uint256 indexed nftId, uint256 listingId, uint256 minPrice, uint256 endTime, uint256 timestamp)",
  "function bid(uint256 listingId) payable",
  "function end(uint256 listingId)",
  "function getListedByOwner() view returns (uint256[] listingsByOwner)",
  "function getListing(uint256 listingId) view returns (address nftAddress, uint256 nftId, uint256 highestBid, uint256 minPrice, uint256 endTime)",
  "function getListingToBid() view returns (uint256[] listingsToBid)",
  "function list(address nftAddress, uint256 nftId, uint256 minPrice, uint256 numHours)",
  "function onERC721Received(address operator, address from, uint256 tokenId, bytes data) pure returns (bytes4)",
  "function withdrawFunds()",
];

const provider = new ethers.BrowserProvider(window.ethereum);

export const connect = async () => {
  await provider.send("eth_requestAccounts", []);
  const minter = await getMintyContract();
  const auction = await getAuctionContract();

  return [auction, minter];
};

export const getAuctionContract = async () => {
  const signer = await provider.getSigner();
  return new Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, signer);
};

export const getMintyContract = async () => {
  const signer = await provider.getSigner();
  return new Contract(MINTY_CONTRACT_ADDRESS, MINTY_CONTRACT_ABI, signer);
};
