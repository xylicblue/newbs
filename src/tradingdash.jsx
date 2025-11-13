// src/components/TradingDashboard.js
import React from "react";
import { Markets } from "./market";
import PriceIndexChart from "./chart";
import { TradingPanel } from "./tradingpanel"; // Import the new TradingPanel
import PositionPanel from "./components/PositionPanel"; // Import PositionPanel
import WalletStatus from "./components/WalletStatus"; // Import WalletStatus
import { useMarket } from "./marketcontext"; // Ensure you have access to the selected market

// Import the existing CSS file
import "./trading.css";

export const TradingDashboard = () => {
  const { selectedMarket } = useMarket(); // Get the currently selected market from context

  return (
    <div className="trading-dashboard">
      {/* Phantom Mode Pill */}
      <div className="phantom-mode-pill">
        <span className="phantom-icon">👻</span>
        <span className="phantom-label">PHANTOM MODE</span>
        <span className="phantom-divider">|</span>
        <span className="phantom-status">Testnet</span>
      </div>

      {/* --- Left Column: Markets and Wallet (Sticky) --- */}
      <div className="dashboard-markets">
        <div className="panel">
          <Markets />
        </div>
        <div className="gradient-divider"></div>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <WalletStatus />
        </div>
      </div>

      {/* --- Center Column: Chart and Positions --- */}
      <div className="dashboard-main">
        <div className="panel" style={{ padding: "0.25rem" }}>
          <PriceIndexChart />
        </div>
        <div className="section-divider"></div>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <PositionPanel />
        </div>
      </div>

      {/* --- Right Column: Trading Panel (Sticky) --- */}
      <div className="dashboard-trade-panel">
        <div className="panel">
          <TradingPanel selectedMarket={selectedMarket} />
        </div>
      </div>
    </div>
  );
};
