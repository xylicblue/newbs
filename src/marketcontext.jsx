// src/context/MarketContext.js
import React, { createContext, useState, useContext } from "react";
import { MARKET_IDS } from "./contracts/addresses";

// Both markets are deployed on Sepolia testnet
const AVAILABLE_MARKETS = {
  "ETH-PERP-V2": {
    name: "ETH-PERP-V2",
    displayName: "ETH-PERP ($3.75)",
    type: "Perpetual",
    baseAsset: "ETH",
    quoteAsset: "USDC",
    marketId: MARKET_IDS['ETH-PERP-V2'],
  },
  "ETH-PERP": {
    name: "ETH-PERP",
    displayName: "ETH-PERP ($2000) [OLD]",
    type: "Perpetual",
    baseAsset: "ETH",
    quoteAsset: "USDC",
    marketId: MARKET_IDS['ETH-PERP'],
  },
};

// Default to the new market with $3.75 price
const DEFAULT_MARKET = AVAILABLE_MARKETS["ETH-PERP-V2"];

// 1. Create the context
const MarketContext = createContext();

// 2. Create the Provider component
export const MarketProvider = ({ children }) => {
  // State to hold the currently selected market
  // Default to ETH-PERP-V2 (the new $3.75 market)
  const [selectedMarket, setSelectedMarket] = useState(DEFAULT_MARKET);

  // Function to change the market
  // Supports both ETH-PERP-V2 and ETH-PERP
  const selectMarket = (marketName) => {
    const market = AVAILABLE_MARKETS[marketName];
    
    if (market) {
      setSelectedMarket(market);
      console.log("Market selected:", market);
    } else {
      console.warn(`Market ${marketName} not found. Available markets:`, Object.keys(AVAILABLE_MARKETS));
      // Don't change if market not found
    }
  };

  return (
    <MarketContext.Provider value={{ selectedMarket, selectMarket, availableMarkets: AVAILABLE_MARKETS }}>
      {children}
    </MarketContext.Provider>
  );
};

// 3. Create a custom hook for easy access to the context
export const useMarket = () => {
  return useContext(MarketContext);
};
