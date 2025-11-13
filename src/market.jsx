// src/components/Markets.js --- PURE CSS VERSION ---

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useMarketsData } from "./marketData";
// We no longer import any shadcn components
import { useMarket } from "./marketcontext";
const formatPrice = (price) =>
  price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatPercent = (percent) =>
  `${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`;

export const Markets = () => {
  const { markets, isLoading, error } = useMarketsData();
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { selectMarket } = useMarket();
  const previousPricesRef = useRef({});
  const [priceChanges, setPriceChanges] = useState({});

  // Track price changes for animations
  useEffect(() => {
    const changes = {};
    markets.forEach((market) => {
      const currentPrice = market.markPrice || market.oraclePrice;
      const previousPrice = previousPricesRef.current[market.name];

      if (previousPrice !== undefined && previousPrice !== currentPrice) {
        changes[market.name] = currentPrice > previousPrice ? "up" : "down";

        // Clear animation after duration
        setTimeout(() => {
          setPriceChanges((prev) => {
            const updated = { ...prev };
            delete updated[market.name];
            return updated;
          });
        }, 1000);
      }

      previousPricesRef.current[market.name] = currentPrice;
    });

    if (Object.keys(changes).length > 0) {
      setPriceChanges((prev) => ({ ...prev, ...changes }));
    }
  }, [markets]);

  const filteredAndSearchedMarkets = useMemo(() => {
    return markets
      .filter((market) => {
        if (filter === "All") return true;
        return market.type === filter;
      })
      .filter((market) =>
        market.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [markets, filter, searchTerm]);

  if (isLoading)
    return <div style={{ textAlign: "center" }}>Loading markets...</div>;
  if (error)
    return (
      <div style={{ textAlign: "center", color: "#f87171" }}>
        Failed to load markets.
      </div>
    );

  // We now use standard HTML elements like <input>, <button>, and <table>
  return (
    <div className="markets-container">
      <h2>Markets</h2>
      <div className="markets-controls">
        {/* --- REPLACED <Tabs> WITH BUTTONS --- */}
        <div className="markets-tabs-list">
          <button
            className={`markets-tabs-trigger ${
              filter === "All" ? "active" : ""
            }`}
            onClick={() => setFilter("All")}
          >
            All
          </button>
          <button
            className={`markets-tabs-trigger ${
              filter === "Perpetual" ? "active" : ""
            }`}
            onClick={() => setFilter("Perpetual")}
          >
            Perps
          </button>
          <button
            className={`markets-tabs-trigger ${
              filter === "Future" ? "active" : ""
            }`}
            onClick={() => setFilter("Future")}
          >
            Futures
          </button>
        </div>

        {/* --- REPLACED <Input> WITH <input> --- */}
        <input
          type="text"
          placeholder="Search..."
          className="markets-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        {/* --- REPLACED <Table> WITH <table> --- */}
        <table className="markets-table">
          <thead>
            <tr>
              <th>Market</th>
              <th className="text-right">Price</th>
              <th className="text-right">24h Chg</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSearchedMarkets.map((market) => (
              <tr key={market.name} onClick={() => selectMarket(market.name)}>
                <td className="font-medium">
                  {market.displayName || market.name}
                  {market.status === "Deprecated" && (
                    <span className="deprecated-badge-small">OLD</span>
                  )}
                </td>
                <td
                  className={`text-right market-price ${
                    priceChanges[market.name]
                      ? `price-flash-${priceChanges[market.name]}`
                      : ""
                  }`}
                >
                  ${formatPrice(market.markPrice || market.oraclePrice)}
                  {priceChanges[market.name] && (
                    <span
                      className={`price-indicator price-indicator-${
                        priceChanges[market.name]
                      }`}
                    >
                      {priceChanges[market.name] === "up" ? "↑" : "↓"}
                    </span>
                  )}
                </td>
                <td
                  className={`text-right ${
                    market.change24h > 0 ? "text-green" : "text-red"
                  }`}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {market.change24h > 0 ? "▲" : "▼"}
                    {formatPercent(market.change24h)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
