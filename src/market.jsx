// src/components/Markets.js --- PURE CSS VERSION ---

import React, { useState, useMemo } from "react";
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
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#888' }}>
                      [OLD]
                    </span>
                  )}
                </td>
                <td className="text-right">
                  ${formatPrice(market.markPrice || market.oraclePrice)}
                </td>
                <td
                  className={`text-right ${
                    market.change24h > 0 ? "text-green" : "text-red"
                  }`}
                >
                  {formatPercent(market.change24h)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
