// src/components/TradingPanel.js
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-hot-toast";
import "./tradingpanel.css";
import { useMarketRealTimeData } from "./marketData";
import MintUSDC from "./components/MintUSDC";
import CollateralManager from "./components/CollateralManager";
import { useOpenPosition, useAccountValue } from "./hooks/useClearingHouse";
import { MARKET_IDS } from "./contracts/addresses";

// Info Tooltip Component with Portal
const InfoTooltip = ({ title, description }) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0, arrowLeft: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const wrapperRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const tooltipLeft = rect.right - 220;
      const iconCenter = rect.left + rect.width / 2;
      const arrowLeft = iconCenter - tooltipLeft;
      
      setPosition({
        top: rect.bottom + 8,
        left: tooltipLeft,
        arrowLeft: arrowLeft,
      });
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <div
        className="info-icon-wrapper"
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="info-icon">ⓘ</span>
      </div>
      {isHovered &&
        ReactDOM.createPortal(
          <div
            className="info-tooltip info-tooltip-visible"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              '--arrow-left': `${position.arrowLeft}px`,
            }}
          >
            <div className="tooltip-title">{title}</div>
            <div className="tooltip-text">{description}</div>
          </div>,
          document.body
        )}
    </>
  );
};

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
  const buyLabel = "Buy (Long)";
  const sellLabel = "Sell (Short)";

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
            <span className="label">
              Mark Price
              <InfoTooltip
                title="Mark Price"
                description="The current trading price from the virtual Automated Market Maker (vAMM). This is the price at which trades are executed on the platform."
              />
            </span>
            <span className="value price-mark">${market.price}</span>
          </div>
          {isPerpetual && (
            <>
              <div className="stat-item">
                <span className="label">
                  TWAP (15m)
                  <InfoTooltip
                    title="TWAP (15 min)"
                    description="Time-Weighted Average Price over the last 15 minutes. This smoothed price helps prevent manipulation and is used for funding rate calculations."
                  />
                </span>
                <span className="value">${market.vammPrice}</span>
              </div>
              <div className="stat-item">
                <span className="label">
                  Index Price
                  <InfoTooltip
                    title="Index Price"
                    description="The reference price from external oracles (like Chainlink). Represents the spot market price and is used to calculate funding rates and prevent market manipulation."
                  />
                </span>
                <span className="value">${market.indexPrice}</span>
              </div>
            </>
          )}
          <div className="stat-item">
            <span className="label">
              24h Change
              <InfoTooltip
                title="24h Change"
                description="The percentage price change over the last 24 hours. Calculated by comparing current price with the price from 24 hours ago."
              />
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
            <span className="label">
              24h Volume
              <InfoTooltip
                title="24h Volume"
                description="Total trading volume in USD over the last 24 hours. Higher volume indicates more active trading and better liquidity."
              />
            </span>
            <span className="value">
              {market.volume24h}
              <span className="approx-indicator">≈</span>
            </span>
          </div>
          {isPerpetual ? (
            <div className="stat-item">
              <span className="label">
                Funding Rate
                <InfoTooltip
                  title="Funding Rate"
                  description="The periodic payment between long and short positions every 8 hours. Positive rates mean longs pay shorts; negative rates mean shorts pay longs. This keeps the perpetual price anchored to the spot price."
                />
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
              <span className="btn-main-text">{"BUY"}</span>
              <span className="btn-sub-text">(LONG)</span>
            </button>
            <button
              className={`tp-tab-btn ${side === "Sell" ? "active-sell" : ""}`}
              onClick={() => setSide("Sell")}
            >
              <span className="btn-main-text">{"SELL"}</span>
              <span className="btn-sub-text">(SHORT)</span>
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

          <div className="size-slider-section">
            <div className="size-slider-header">
              <span className="size-slider-label">Quick Size</span>
              <span className="size-slider-hint">% of available balance</span>
            </div>
            <div className="size-slider">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handleSizeButtonClick(p)}
                  title={`Use ${p}% of available balance`}
                >
                  {p}%
                </button>
              ))}
            </div>
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
