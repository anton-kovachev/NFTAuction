const { expect } = require("chai");
const { assert } = require("console");
const { ethers } = require("hardhat");
const { describe } = require("node:test");

describe("Auction", async () => {
  let owner, addr1, addr2, nftId;
  let minter;
  let auction;

  const getCurrentTime = async () => {
    const blockNumber = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock("latest");
    return currentBlock.timestamp;
  };

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Minty = await ethers.getContractFactory("Minty");
    minter = await Minty.deploy("TON", "TN");
    await minter.deployed();

    const txn = await minter.mintToken(owner.address, "first-test-nft");
    await txn.wait();

    const nftFilter = minter.filters.NFT_Minted();
    const results = await minter.queryFilter(nftFilter);

    nftId = Number(results[0].args[1]);

    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy();
    await auction.deployed();
  });

  describe("List", async () => {
    it("can't list an nft if not the owner", async () => {
      await expect(
        auction.connect(addr1).list(minter.address, nftId, 30, 5)
      ).to.be.revertedWith("You don't own this Nft");
    });

    it("can't list an nft if not granted approval to Auction", async () => {
      await expect(
        auction.list(minter.address, nftId, 30, 5)
      ).to.be.revertedWith("This contract is not approved to access this Nft");
    });

    it("can list an nft if granted approval to Auction first", async () => {
      await minter.approve(auction.address, nftId);
      await expect(auction.list(minter.address, nftId, 30, 5))
        .to.emit(auction, "List")
        .withArgs(
          owner.address,
          minter.address,
          nftId,
          0,
          30,
          (await getCurrentTime()) + 5 * 60 * 60 * 1000,
          (await getCurrentTime()) + 1
        );
    });
  });

  describe("Bid", async () => {
    it("can't bid on your own listing", async () => {
      await expect(auction.bid(0)).to.be.revertedWith(
        "You can't bid on your own listing."
      );
    });

    it("can't bid on a listing that does not exists", async () => {
      await expect(auction.connect(addr1).bid(1)).to.be.revertedWith(
        "Listing does not exists."
      );
    });

    it("can't bid on a listing with below the minimum bidding price", async () => {
      await expect(
        auction.connect(addr1).bid(0, { value: 10 })
      ).to.be.revertedWith("You must bid at least at the minimum price.");
    });

    it("can bid on a listing with above the minimum bidding price", async () => {
      await expect(auction.connect(addr1).bid(0, { value: 30 }))
        .to.be.emit(auction, "Bid")
        .withArgs(addr1.address, 0, 30, await getCurrentTime());
    });

    it("can't outbid your own highest bid", async () => {
      await expect(
        auction.connect(addr1).bid(0, { value: 40 })
      ).to.be.revertedWith("You can't outbid your own highest bid.");
    });

    it("can bid on a listing with a higher bid", async () => {
      await expect(auction.connect(addr2).bid(0, { value: 50 }))
        .to.be.emit(auction, "Bid")
        .withArgs(addr2.address, 0, 50, await getCurrentTime());
    });
  });

  describe("Listing", async () => {
    it("can't fetch an unexisting listing", async () => {
      await expect(auction.getListing(5)).to.be.revertedWith(
        "Listing does not exists."
      );
    });

    it("can fetch an existing listing", async () => {
      const [minterAddress, minterNftId, highestBid, minPrice] = await auction.getListing(0);
      expect(minterAddress, minter.address);
      expect(minterAddress, nftId);
      expect(highestBid, 50);
      expect(minPrice, 30);
    });

    it("can fetch owned listings", async () => {
        const listingsByOwner = await auction.getListedByOwner();
        expect(listingsByOwner.map(x => Number(x))).to.deep.equal([0]);
    })

    it("can fetch listings to bid", async () => {
        const listingsToBid = await auction.connect(addr1).getListingToBid();
        expect(listingsToBid.map(x => Number(x))).to.deep.equal([0]);
    })
  });

  describe("End", async () => {
    it("can't end an unexisting nft", async () => {
      await expect(auction.end(5)).to.be.revertedWith(
        "Listing does not exists."
      );
    });

    it("only the nft owner can end the auction", async () => {
      await expect(auction.connect(addr1).end(0)).to.be.revertedWith(
        "Only the nft owner can end the auction."
      );
    });

    it("can't end an nft auction before end time", async () => {
      await expect(auction.end(0)).to.be.revertedWith(
        "Auction for this listing is not over yet."
      );
    });

    it("can't bid after the auction end time has past", async () => {
      ethers.provider.send("evm_mine", [
        (await getCurrentTime()) + 5 * 60 * 60 * 1000,
      ]);
      await expect(
        auction.connect(addr1).bid(0, { value: 60 })
      ).to.be.revertedWith("The auction for this nft listing has ended.");
    });

    it("can end the auction and receive the funds", async () => {
      await expect(await auction.end(0)).to.changeEtherBalances(
        [owner, auction],
        [50, -50]
      );
      expect(await minter.ownerOf(nftId)).to.be.equal(addr2.address);
    });
  });

  describe("Withdraw funds", async () => {
    it("to be able to successfully withdraw funds", async () => {
      await expect(
        await auction.connect(addr1).withdrawFunds()
      ).to.changeEtherBalances([addr1, auction], [30, -30]);
    });
  });
});
