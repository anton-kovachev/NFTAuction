import { useEffect, useState } from "react";
import NftCard from "./NftCard";

const Bid = ({ minter, auction, isConnected }) => {
  const [listingsToBid, setListingsToBid] = useState([]);

  useEffect(() => {
    const fetchListingsToBid = async () => {
      debugger;
      const listingsToBidRaw = await auction.getListingToBid();
      setListingsToBid(listingsToBidRaw.map((x) => Number(x)));
    };

    debugger;
    if (isConnected && auction) {
      fetchListingsToBid();
    }
  }, [minter, auction]);

  return (
    <div>
      <h2>Bid</h2>
      {isConnected && (
        <div className="mt-2">
          <div className="mt-3 w-100 d-flex flex-wrap justify-content-around align-items-center gap-2">
            {listingsToBid.map((x) => {
              return (
                <NftCard
                  key={x}
                  listingId={x}
                  minter={minter}
                  auction={auction}
                  isNftListed={true}
                  canBid={true}
                />
              );
            })}
          </div>
        </div>
      )}
      {!isConnected && <p>Please connect to Metamask</p>}
    </div>
  );
};

export default Bid;
