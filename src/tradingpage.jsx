// src/TradingPage.js

import React from "react";
import { TradingDashboard } from "./tradingdash";
import { MarketProvider } from "./marketcontext";
import NetworkGuard from "./components/NetworkGuard";

const TradingPage = () => {
  return (
    <main className="trading-page-main">
      <NetworkGuard>
        <MarketProvider>
          <TradingDashboard />
        </MarketProvider>
      </NetworkGuard>
    </main>
  );
};

export default TradingPage;
