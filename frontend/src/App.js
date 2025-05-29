import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { connect, getAuctionContract, getMintyContract } from "./contracts";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./Navbar";
import List from "./List";
import Bid from "./Bid";
import { ethers } from "ethers";
import Welcome from "./Welcome";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [auctionContract, setAuctionContract] = useState(null);
  const [minterContract, setMinterContract] = useState(null);

  useEffect(() => {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (!accounts.length) {
        setIsConnected(false);
        setAuctionContract(null);
        setMinterContract(null);
      }
    });

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length) {
          handleConnected(await getAuctionContract(), await getMintyContract());
        } else {
          setIsConnected(false);
        }
      });
  }, []);

  const connectCallback = async () => {
    const [auctionContract, minterContract] = await connect();
    await handleConnected(auctionContract, minterContract);
  };

  const handleConnected = async (auctionContract, minterContract) => {
    setAuctionContract(auctionContract);
    setMinterContract(minterContract);
    setIsConnected(true);
  };

  return (
    <>
      <Router>
        <Navbar isConnected={isConnected} connect={connectCallback} />
        <div className="container">
          <Routes>
            <Route
              path="list"
              element={
                <List
                  isConnected={isConnected}
                  minter={minterContract}
                  auction={auctionContract}
                />
              }
            ></Route>
            <Route
              path="bid"
              element={
                <Bid
                  isConnected={isConnected}
                  minter={minterContract}
                  auction={auctionContract}
                />
              }
            ></Route>
            <Route path="/" element={<Welcome />}></Route>
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
