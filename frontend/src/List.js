import { useEffect, useState } from "react";
import NftCard from "./NftCard";
import { Form, InputGroup, Button } from "react-bootstrap";

const List = ({ isConnected, auction, minter }) => {
  const [ownedNftIds, setOwnNftIds] = useState([]);
  const [newNftUri, setNewNftUri] = useState("");
  const [listedNftIds, setListedNFtIds] = useState([]);

  useEffect(() => {
    if (minter) {
      loadOwnedNFTIds();
    }
  }, [minter]);

  const loadOwnedNFTIds = async () => {
    debugger;
    const nftTokensCount = Number(
      await minter.balanceOf(minter.runner.address)
    );
    const ownedNFTIds = [];

    for (let i = 0; i < nftTokensCount; i++) {
      const ownedNftId = await minter.tokenOfOwnerByIndex(
        minter.runner.address,
        i
      );
      ownedNFTIds.push(Number(ownedNftId));
    }

    setOwnNftIds(ownedNFTIds);
    debugger;
    const ownerListings = (await auction.getListedByOwner()).map((x) =>
      Number(x)
    );
    setListedNFtIds(ownerListings);
  };

  const handleNftMint = async () => {
    if (!isConnected) {
      alert("Please connect to Metamask!");
      return;
    }
    debugger;
    const newNftIdTx = await minter.mintToken(minter.runner.address, newNftUri);
    const txnReceipt = await newNftIdTx.wait();
    const mintFilter = minter.filters.NFT_Minted(null, null);
    const mintEvents = await minter.queryFilter(
      mintFilter,
      txnReceipt.blockNumber
    );
    debugger;
    const newNftId = Number(mintEvents[0].args[1]);

    setNewNftUri("");
    setOwnNftIds([...ownedNftIds, newNftId]);
  };

  return (
    <div>
        <h2>List</h2>
      {isConnected && (
        <>
          <div>
            <h2 className="mt-2">Your NFTs</h2>
            <div className="mt-3 w-100 d-flex flex-wrap justify-content-around align-items-center gap-2">
              {!!ownedNftIds.length &&
                ownedNftIds.map((nftId) => (
                  <NftCard
                    key={nftId}
                    nftId={nftId}
                    minter={minter}
                    auction={auction}
                    reloadData={loadOwnedNFTIds}
                    isNftListed={false}
                  />
                ))}{" "}
              {!!!ownedNftIds.length && (
                <p className="font-14">You have no NFTS.</p>
              )}
            </div>
          </div>
          <div className="mt-2">
            <h2>Your Auction Listings</h2>
            <div className="mt-3 w-100 d-flex flex-wrap justify-content-around align-items-center gap-2">
              {!!listedNftIds.length &&
                listedNftIds.map((listingId) => (
                  <NftCard
                    key={listingId}
                    listingId={listingId}
                    minter={minter}
                    auction={auction}
                    reloadData={loadOwnedNFTIds}
                    isNftListed={true}
                  />
                ))}{" "}
              {!!!listedNftIds.length && (
                <p>You have no NFTS listed on auction.</p>
              )}
            </div>
          </div>
          <div className="mt-5 w-50 d-flex align-items-center justify-content-center gap-2">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Enter Pinata Hash Id"
                value={newNftUri}
                onChange={(e) => setNewNftUri(e.target.value)}
              />
            </InputGroup>
            <Button variant="info" onClick={(e) => handleNftMint()}>
              Mint
            </Button>
          </div>
        </>
      )}
      {!isConnected && <p>Please connect to Metamask</p>}
    </div>
  );
};

export default List;
