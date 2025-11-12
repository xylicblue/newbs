import { useState, useEffect } from "react";
import { useMarkPrice, useTWAP, useFundingRate } from "./hooks/useVAMM";
import { useOraclePrice } from "./hooks/useOracle";
import { SEPOLIA_CONTRACTS, MARKET_IDS, DEFAULT_MARKET_ID } from "./contracts/addresses";

// Both ETH-PERP markets deployed on Sepolia testnet
const DEPLOYED_MARKETS = [
  {
    name: "ETH-PERP-V2",
    displayName: "ETH-PERP ($3.75)",
    type: "Perpetual",
    baseAsset: "ETH",
    quoteAsset: "USDC",
    vammAddress: SEPOLIA_CONTRACTS.vammProxy, // New vAMM with $3.75
    marketId: MARKET_IDS['ETH-PERP-V2'],
    status: "Active",
    isDefault: true,
  },
  {
    name: "ETH-PERP",
    displayName: "ETH-PERP ($2000) [OLD]",
    type: "Perpetual",
    baseAsset: "ETH",
    quoteAsset: "USDC",
    vammAddress: SEPOLIA_CONTRACTS.vammProxyOld, // Old vAMM with $2000
    marketId: MARKET_IDS['ETH-PERP'],
    status: "Deprecated",
    isDefault: false,
  },
];

/**
 * Hook to get real-time market data from deployed vAMM contracts
 */
export const useMarketsData = () => {
  const [data, setData] = useState({
    markets: [],
    isLoading: true,
    error: null,
  });

  // Fetch real mark price from new vAMM (updates every 5s)
  const { price: markPriceNew, isLoading: priceLoadingNew, error: errorNew } = useMarkPrice(
    SEPOLIA_CONTRACTS.vammProxy,
    5000
  );

  // Fetch mark price from old vAMM
  const { price: markPriceOld, isLoading: priceLoadingOld, error: errorOld } = useMarkPrice(
    SEPOLIA_CONTRACTS.vammProxyOld,
    5000
  );

  useEffect(() => {
    // Log for debugging
    console.log('useMarketsData:', { 
      new: { markPriceNew, priceLoadingNew, errorNew },
      old: { markPriceOld, priceLoadingOld, errorOld }
    });

    if (!priceLoadingNew && !priceLoadingOld) {
      const markets = [];

      // Add new market (ETH-PERP-V2)
      if (markPriceNew && !errorNew) {
        markets.push({
          name: "ETH-PERP-V2",
          displayName: "ETH-PERP ($3.75)",
          type: "Perpetual",
          markPrice: parseFloat(markPriceNew),
          change24h: 0, // TODO: Calculate from historical data or events
          vammAddress: SEPOLIA_CONTRACTS.vammProxy,
          marketId: MARKET_IDS['ETH-PERP-V2'],
          status: "Active",
        });
      }

      // Add old market (ETH-PERP)
      if (markPriceOld && !errorOld) {
        markets.push({
          name: "ETH-PERP",
          displayName: "ETH-PERP ($2000) [OLD]",
          type: "Perpetual",
          markPrice: parseFloat(markPriceOld),
          change24h: 0,
          vammAddress: SEPOLIA_CONTRACTS.vammProxyOld,
          marketId: MARKET_IDS['ETH-PERP'],
          status: "Deprecated",
        });
      }

      if (markets.length > 0) {
        setData({ markets, isLoading: false, error: null });
      } else {
        const error = errorNew || errorOld || 'No markets available';
        setData({ markets: [], isLoading: false, error });
      }
    }
  }, [markPriceNew, markPriceOld, priceLoadingNew, priceLoadingOld, errorNew, errorOld]);

  return data;
};

/**
 * Get detailed market data for a specific market
 * Fetches real-time data from vAMM contract
 */
export const getMarketDetails = (marketName) => {
  const market = DEPLOYED_MARKETS.find(m => m.name === marketName);
  
  if (!market) {
    return null;
  }

  return {
    name: market.name,
    displayName: market.displayName,
    type: market.type,
    baseAsset: market.baseAsset,
    quoteAsset: market.quoteAsset,
    status: market.status,
    vammAddress: market.vammAddress,
    marketId: market.marketId,
    isDefault: market.isDefault,
    // Note: These will be fetched by components using hooks
    // We return a structure but components should use useMarketRealTimeData
  };
};

/**
 * Hook to get real-time market details with all live data
 * Use this in components that need live prices, funding rates, etc.
 */
export const useMarketRealTimeData = (marketName) => {
  const [data, setData] = useState(null);

  // Find the market config
  const market = DEPLOYED_MARKETS.find(m => m.name === marketName);
  
  if (!market) {
    return { data: null, isLoading: false, error: "Market not found" };
  }

  const vammAddress = market.vammAddress;

  // Fetch real-time data from vAMM
  const { price: markPrice, isLoading: priceLoading } = useMarkPrice(vammAddress, 5000);
  const { twap, isLoading: twapLoading } = useTWAP(vammAddress, 900); // 15 min TWAP
  const { cumulativeFunding, lastFundingTime } = useFundingRate(vammAddress);

  // Also fetch Oracle price to calculate funding rate premium
  const { price: oraclePrice, isLoading: oracleLoading } = useOraclePrice(
    SEPOLIA_CONTRACTS.oracle,
    10000
  );

  useEffect(() => {
    if (!priceLoading && !twapLoading && !oracleLoading && markPrice && twap && oraclePrice) {
      // Calculate funding rate as: (Mark Price - Index Price) / Index Price
      // This is the "premium" that determines funding payments
      const markPriceNum = parseFloat(markPrice);
      const oraclePriceNum = parseFloat(oraclePrice);
      const premium = ((markPriceNum - oraclePriceNum) / oraclePriceNum) * 100;
      
      // Annualized funding rate (assuming 8 hour funding periods, 3x per day)
      const fundingRateAnnualized = premium * 3 * 365;
      
      // Current premium (for next funding payment)
      const fundingRatePercent = premium.toFixed(4);
      const fundingRateDisplay = premium >= 0
        ? `+${fundingRatePercent}%`
        : `${fundingRatePercent}%`;

      // Format prices for display
      const markPriceFormatted = markPriceNum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const twapFormatted = parseFloat(twap).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Calculate 24h change (mock - difference between TWAP and current)
      const change24hMock = ((markPriceNum - parseFloat(twap)) / parseFloat(twap)) * 100;
      const change24hDisplay = change24hMock.toFixed(2) + '%';

      setData({
        name: market.name,
        displayName: market.displayName,
        type: market.type,
        baseAsset: market.baseAsset,
        quoteAsset: market.quoteAsset,
        status: market.status,
        marketId: market.marketId,
        // Raw values
        markPriceRaw: markPriceNum,
        twapRaw: parseFloat(twap),
        oraclePriceRaw: oraclePriceNum,
        fundingRateRaw: premium / 100, // As decimal
        // Formatted for display
        price: markPriceFormatted,
        indexPrice: oraclePriceNum.toFixed(2), // Oracle/Index price
        vammPrice: twapFormatted,
        fundingRate: fundingRateDisplay,
        fundingRateAnnualized: fundingRateAnnualized.toFixed(2) + '% APR',
        change24h: change24hDisplay, // Mock based on TWAP difference
        change24hValue: change24hMock,
        volume24h: "~$" + (markPriceNum * 10).toFixed(2), // Mock: assume 10 ETH traded
        openInterest: "~" + (Math.random() * 100).toFixed(2) + " ETH", // Mock
        lastFundingTime: lastFundingTime,
        // Helper info
        premium: premium.toFixed(6) + '%',
        premiumRaw: premium,
      });
    }
  }, [markPrice, twap, oraclePrice, cumulativeFunding, lastFundingTime, priceLoading, twapLoading, oracleLoading, market]);

  return {
    data,
    isLoading: priceLoading || twapLoading || oracleLoading,
    error: null,
  };
};
