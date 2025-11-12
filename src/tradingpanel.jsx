// src/components/TradingPanel.js
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import "./tradingpanel.css";
import { useMarketRealTimeData } from "./marketData";
import MintUSDC from "./components/MintUSDC";
import CollateralManager from "./components/CollateralManager";
import { useOpenPosition, useAccountValue } from "./hooks/useClearingHouse";
import { MARKET_IDS } from "./contracts/addresses";

const mockUserAccount = {
  availableMargin: "18,450.00 USDC",
};

export const TradingPanel = ({ selectedMarket }) => {
  const [side, setSide] = useState("Buy");
  const [size, setSize] = useState("");
  const [priceLimit, setPriceLimit] = useState("");

  // Get market ID from market name
  const marketId = MARKET_IDS[selectedMarket] || MARKET_IDS["ETH-PERP-V2"];

  // Get account value
  const { accountValue, isLoading: isLoadingAccount } = useAccountValue();

  // Trading hook
  const {
    openPosition,
    isPending,
    isSuccess,
    error: tradeError,
    hash,
  } = useOpenPosition(marketId);

  if (!selectedMarket) {
    return (
      <div className="trading-panel-placeholder">
        <h3>Select a Market</h3>
        <p>Choose a market from the list to begin trading.</p>
      </div>
    );
  }

  const marketName =
    typeof selectedMarket === "string" ? selectedMarket : selectedMarket.name;

  // Use real-time data hook instead of static getMarketDetails
  const { data: market, isLoading, error } = useMarketRealTimeData(marketName);

  if (isLoading) {
    return (
      <div className="trading-panel-placeholder">
        <h3>Loading Market Data...</h3>
        <p>Fetching live data from blockchain...</p>
        <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "8px" }}>
          Market: {marketName}
        </p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="trading-panel-placeholder">
        <h3>Market Not Found</h3>
        <p>Could not load data for {marketName}.</p>
        <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "8px" }}>
          Error: {error || "Unknown error"}
        </p>
      </div>
    );
  }

  const isPerpetual = market.type === "Perpetual";
  const changeIsPositive = market.change24hValue >= 0;

  // --- DYNAMIC LABELS ---
  const buyLabel = isPerpetual ? "Buy" : "Buy";
  const sellLabel = isPerpetual ? "Sell" : "Sell";

  const handleSizeButtonClick = (percentage) => {
    const simulatedTotal = 2.5;
    setSize((simulatedTotal * (percentage / 100)).toFixed(4));
  };

  // Handle trade execution
  const handleTrade = async () => {
    if (!size || parseFloat(size) <= 0) {
      toast.error("Please enter a valid size");
      return;
    }

    try {
      const isLong = side === "Buy";
      const priceLimitValue =
        priceLimit && parseFloat(priceLimit) > 0 ? priceLimit : 0;

      openPosition(isLong, size, priceLimitValue);
      toast.loading(
        `${side === "Buy" ? "Opening long" : "Opening short"} position...`,
        { id: "trade" }
      );
    } catch (error) {
      console.error("Trade error:", error);
      toast.error("Failed to execute trade: " + error.message);
    }
  };

  // Handle trade success
  if (isSuccess && hash) {
    toast.success(
      <div>
        <div>Position opened successfully!</div>
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "underline", fontSize: "0.9em" }}
        >
          View on Etherscan →
        </a>
      </div>,
      { id: "trade", duration: 5000 }
    );
    // Reset form
    setSize("");
    setPriceLimit("");
  }

  // Handle trade error
  if (tradeError) {
    toast.error("Trade failed: " + tradeError.message, { id: "trade" });
  }

  return (
    <div className="trading-panel-container">
      {/* --- Collateral Section --- */}
      <div className="wallet-section">
        <CollateralManager />
        <MintUSDC />
      </div>

      {/* --- UNIFIED TRADING SECTION --- */}
      <div className="trading-section">
        {/* Market Header */}
        <div className="market-header">
          <span className="market-name">
            {market.displayName || market.name}
          </span>
          {market.status === "Deprecated" && (
            <span className="deprecated-badge">DEPRECATED</span>
          )}
        </div>

        {/* Market Stats Grid */}
        <div className="market-stats">
          <div className="stat-item">
            <span className="label" title="Current vAMM trading price">
              Mark Price
            </span>
            <span className="value price-mark">${market.price}</span>
          </div>
          {isPerpetual && (
            <>
              <div className="stat-item">
                <span
                  className="label"
                  title="15-minute Time-Weighted Average Price"
                >
                  TWAP (15m)
                </span>
                <span className="value">${market.vammPrice}</span>
              </div>
              <div className="stat-item">
                <span
                  className="label"
                  title="Oracle/Index price from Chainlink or external source"
                >
                  Index Price
                </span>
                <span className="value">${market.indexPrice}</span>
              </div>
            </>
          )}
          <div className="stat-item">
            <span
              className="label"
              title="Estimated based on TWAP vs current price"
            >
              24h Change
            </span>
            <span
              className={`value ${
                changeIsPositive ? "text-green" : "text-red"
              }`}
            >
              {market.change24h}
              <span className="approx-indicator">≈</span>
            </span>
          </div>
          <div className="stat-item">
            <span
              className="label"
              title="Estimated trading volume (requires event indexing for accuracy)"
            >
              24h Volume
            </span>
            <span className="value">
              {market.volume24h}
              <span className="approx-indicator">≈</span>
            </span>
          </div>
          {isPerpetual ? (
            <div className="stat-item">
              <span
                className="label"
                title={`Premium: ${market.premium || "0%"} | Annualized: ${
                  market.fundingRateAnnualized || "N/A"
                }`}
              >
                Funding Rate
              </span>
              <span className="value funding-rate">
                {market.fundingRate}
                <span className="rate-period">/8h</span>
              </span>
            </div>
          ) : (
            <div className="stat-item">
              <span className="label">Expires</span>
              <span className="value">
                {new Date(market.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="section-divider"></div>

        {/* Order Entry Form */}
        <div className="order-entry">
          <div className="tp-tabs">
            <button
              className={`tp-tab-btn ${side === "Buy" ? "active-buy" : ""}`}
              onClick={() => setSide("Buy")}
            >
              {buyLabel}
            </button>
            <button
              className={`tp-tab-btn ${side === "Sell" ? "active-sell" : ""}`}
              onClick={() => setSide("Sell")}
            >
              {sellLabel}
            </button>
          </div>

          <div className="tp-form-group">
            <label>Price Limit ({market.quoteAsset}) - Optional</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="tp-input"
                placeholder="0.00 (0 = market)"
                value={priceLimit}
                onChange={(e) => setPriceLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="tp-form-group">
            <label>Size</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="tp-input"
                placeholder="0.00"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              <span className="input-asset-label">{market.baseAsset}</span>
            </div>
          </div>

          <div className="size-slider">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} onClick={() => handleSizeButtonClick(p)}>
                {p}%
              </button>
            ))}
          </div>

          <div className="order-summary-item">
            <span>Account Value</span>
            <span>
              {isLoadingAccount
                ? "Loading..."
                : accountValue
                ? `$${parseFloat(accountValue).toFixed(2)}`
                : "$0.00"}
            </span>
          </div>

          <button
            className={`place-order-btn ${
              side === "Buy" ? "btn-buy" : "btn-sell"
            }`}
            onClick={handleTrade}
            disabled={isPending || !size || parseFloat(size) <= 0}
          >
            {isPending
              ? "Processing..."
              : side === "Buy"
              ? buyLabel
              : sellLabel}
          </button>

          {hash && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#667eea", textDecoration: "none" }}
              >
                View transaction →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
