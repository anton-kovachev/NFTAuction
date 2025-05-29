import { useEffect, useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import {
  fetchFileMetadataByPinHash,
  fetchPinataFileUrl,
} from "./pinata-services";

const pinataGateway = "https://lime-written-prawn-451.mypinata.cloud/ipfs";

const NftCard = ({
  nftId,
  listingId,
  minter,
  auction,
  isNftListed,
  reloadData,
  canBid = false,
}) => {
  const [nftData, setNftData] = useState(null);
  const [nftUrl, setNftUrl] = useState(null);
  const [isListed, setIsListed] = useState(false);
  const [currentHighestBid, setCurrentHighestBid] = useState(null);
  const [listingData, setListingData] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [isSold, setIsSold] = useState(false);

  useEffect(() => {
    const getNftUri = async () => {
      let nftUri = "";
      if (isNftListed) {
        const [nftAddress, nftId, highestBid, minPrice, endTime] =
          await auction.getListing(listingId);
        setListingData({
          nftAddress,
          nftId: Number(nftId),
          highestBid: Number(highestBid),
          minPrice: Number(minPrice),
          endTime: new Date(Number(endTime) * 1000).toISOString(),
        });
        nftUri = await minter.tokenURI(nftId);
      } else {
        nftUri = await minter.tokenURI(nftId);
      }

      const nftIpfsHash = nftUri.split("ipfs://")[1];
      setNftUrl(fetchPinataFileUrl(nftIpfsHash));
      setIsListed(isNftListed);

      try {
        const nftData = await fetchFileMetadataByPinHash(nftIpfsHash);
        setNftData(nftData);
      } catch (err) {
        console.log(err);
        alert(
          `Fetching of metadata for ${nftIpfsHash} failed with errr ${err}.`
        );
      }
    };

    if (minter) {
      getNftUri();
    }
  }, [minter, auction, currentHighestBid]);

  useEffect(() => {
    // const listingData =
  }, [isListed]);

  const handleNftList = async () => {

    //The NFT owner should first allow trasfer of the nft to the auction
    const auctionAddress = await auction.getAddress();
    const approveTxn = await minter.approve(auctionAddress, nftId);
    await approveTxn.wait();

    const minterAddress = await minter.getAddress();
    try {
      const listTnx = await auction.list(minterAddress, nftId, 20, 1);
      const txnReceipt = await listTnx.wait();
      const listedFilter = auction.filters.List(
        auction.runner.address,
        await minter.getAddress()
      );
      const listEvents = await auction.queryFilter(
        listedFilter,
        txnReceipt.blockNumber
      );
      const [
        owner,
        nftAddress,
        listedNftId,
        listingId,
        minPrice,
        endTime,
        timestamp,
      ] = listEvents[0].args;
      setListingData({
        nftAddress,
        nftId: Number(nftId),
        highestBid: Number(0).toFixed(2),
        minPrice: Number(minPrice).toFixed(2),
        endTime: Number(endTime) * 1000,
      });
      setIsListed(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBidSubmit = async () => {
    if (Number(bidAmount).toFixed(2) > listingData.highestBid) {
      try {
        const bidTxn = await auction.bid(listingId, {
          value: Number(bidAmount),
        });
        const bidTxnReceipt = await bidTxn.wait();
        setCurrentHighestBid(listingData.bidAmount);
      } catch (e) {
        alert(e.message);
        console.log(e);
      }
    } else {
      alert("You have to bid with a higher price!");
    }
  };

  const handleSell = async () => {
    try {
      const sellTxn = await auction.end(listingId);
      const sellTxnReceipt = await sellTxn.wait();
      alert("NFT sold!");
      setIsSold(true);
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  const isBidEnded = () => {
    return isListed && listingData && listingData?.endTime < Date.now();
  };

  useEffect(() => {

  }, [listingData])

  return (
    <div>
      {nftUrl && (
        <Card style={{ width: "18rem" }}>
          <Card.Img src={nftUrl} />
          <Card.Body>
            <Card.Title>{nftData?.metadata?.name}</Card.Title>
            <Card.Text>{nftData?.metadata?.keyvalues?.description}</Card.Text>
            {!isListed && (
              <Button
                variant="danger"
                onClick={(e) => {
                  handleNftList();
                }}
              >
                List on Auction
              </Button>
            )}
            {isListed && !isSold && (
              <>
                <div>
                  {!isBidEnded() && (
                    <>
                      <p>Listed on Auction.</p>
                      <ul>
                        <li>Min Bid ${listingData?.minPrice}</li>
                        <li>Current Highest Bid ${currentHighestBid || listingData?.highestBid}</li>
                        <li>Auction Ends at {listingData?.endTime}</li>
                      </ul>
                    </>
                  )}
                  {isBidEnded() && (
                    <>
                      <p>
                        Auction Ended. Highest Bid ${currentHighestBid || listingData?.highestBid}{" "}
                      </p>
                      <br />
                      <Button variant="danger" onClick={(e) => handleSell()}>
                        Sell
                      </Button>
                    </>
                  )}
                </div>
                {canBid && (
                  <div>
                    <Form>
                      <Form.Group className="mt-3 d-flex align-items-center justify-content-around">
                        <Form.Label>Bid:</Form.Label>
                        <Form.Control
                          type="number"
                          value={bidAmount}
                          onChange={(e) =>
                            setBidAmount(Number(e.target.value).toFixed(2))
                          }
                          placeholder="Bid amount"
                        />
                        <Button
                          variant="primary"
                          type="button"
                          onClick={(e) => handleBidSubmit()}
                        >
                          Submit
                        </Button>
                      </Form.Group>
                    </Form>
                  </div>
                )}
              </>
            )}{" "}
            {isListed && isSold && <p style={{ color: "red" }}>NFT sold</p>}
          </Card.Body>
        </Card>
      )}
      {!nftUrl && <p>NFT not found!</p>}
    </div>
  );
};

export default NftCard;
