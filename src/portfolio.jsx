import React, { useState, useEffect } from "react";
import { supabase } from "./creatclient";
import { useAccount } from "wagmi";
import { useAllPositions, useAccountValue } from "./hooks/useClearingHouse";
import "./portfolio.css";

import {
  HiOutlineWallet,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineBanknotes,
  HiOutlineRectangleStack,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowsRightLeft,
  HiArrowUp,
  HiArrowDown,
} from "react-icons/hi2";

const mockPortfolioData = {
  totalValue: 125678.9,
  pnl24h: 1234.56,
  pnl24hPercent: 1.12,
  availableMargin: 85678.9,
  totalCollateral: 125678.9,
  buyingPower: 856789.0,
};

const mockOpenPositions = [
  {
    market: "BTC-PERP",
    size: 0.5,
    side: "Long",
    entryPrice: 65123.45,
    markPrice: 68125.6,
    pnl: 1501.08,
    liqPrice: 59876.5,
  },
  {
    market: "ETH-PERP",
    size: 10,
    side: "Short",
    entryPrice: 3500.0,
    markPrice: 3455.9,
    pnl: 441.0,
    liqPrice: 3850.0,
  },
  {
    market: "SOL-PERP",
    size: 200,
    side: "Long",
    entryPrice: 155.5,
    markPrice: 168.01,
    pnl: -1498.0,
    liqPrice: 142.3,
  },
];

const mockOrderHistory = [
  {
    date: "2023-10-26 14:30:15",
    market: "BTC-PERP",
    type: "Limit",
    side: "Buy",
    price: 65123.45,
    amount: 0.5,
    status: "Filled",
  },
  {
    date: "2023-10-27 09:00:00",
    market: "ETH-PERP",
    type: "Limit",
    side: "Sell",
    price: 3600.0,
    amount: 5,
    status: "Cancelled",
  },
  {
    date: "2023-10-28 11:45:30",
    market: "SOL-PERP",
    type: "Market",
    side: "Buy",
    price: 170.0,
    amount: 100,
    status: "Filled",
  },
];

const mockTradeHistory = [
  {
    date: "2023-10-26 14:30:15",
    market: "BTC-PERP",
    side: "Buy",
    price: 65123.45,
    amount: 0.5,
    fee: 32.56,
  },
  {
    date: "2023-10-26 10:15:45",
    market: "ETH-PERP",
    side: "Sell",
    price: 3500.0,
    amount: 10,
    fee: 17.5,
  },
  {
    date: "2023-10-25 22:05:10",
    market: "SOL-PERP",
    side: "Buy",
    price: 155.5,
    amount: 200,
    fee: 15.55,
  },
];

// --- UI SUB-COMPONENTS ---
// Breaking the UI into smaller components makes the code cleaner and easier to manage.

const PortfolioHeader = ({ username, portfolioValue, pnl, pnlPercent }) => (
  <div className="portfolio-header">
    <div className="header-left">
      <span className="welcome-back">Welcome back,</span>
      <h1 className="username">{username?.toUpperCase() || "Trader"}</h1>
    </div>
    <div className="header-right">
      <div className="portfolio-value-card">
        <div className="card-label">
          <HiOutlineWallet />
          <span>Total Portfolio Value</span>
        </div>
        <span className="value">${portfolioValue.toLocaleString()}</span>
      </div>
      <div className="pnl-card">
        <div className="card-label">
          {pnl >= 0 ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
          <span>24h P&L</span>
        </div>
        <span className={`value ${pnl >= 0 ? "text-green" : "text-red"}`}>
          ${pnl.toLocaleString()} ({pnlPercent}%)
        </span>
      </div>
    </div>
  </div>
);

const IconSummaryCard = ({ icon, label, value }) => (
  <div className="summary-card">
    <div className="card-icon">{icon}</div>
    <div className="card-content">
      <span className="label">{label}</span>
      <span className="value">${value.toLocaleString()}</span>
    </div>
  </div>
);

const AccountSummary = ({ availableMargin, totalCollateral, buyingPower }) => (
  <div className="account-summary">
    <IconSummaryCard
      icon={<HiOutlineBanknotes />}
      label="Available Margin"
      value={availableMargin}
    />
    <IconSummaryCard
      icon={<HiOutlineShieldCheck />}
      label="Total Collateral"
      value={totalCollateral}
    />
    <IconSummaryCard
      icon={<HiOutlineBolt />}
      label="Buying Power"
      value={buyingPower}
    />
  </div>
);

const HistoryTabs = ({ activeTab, setActiveTab }) => (
  <div className="history-tabs">
    <button
      className={activeTab === "positions" ? "active" : ""}
      onClick={() => setActiveTab("positions")}
    >
      <HiOutlineRectangleStack /> Open Positions
    </button>
    <button
      className={activeTab === "orders" ? "active" : ""}
      onClick={() => setActiveTab("orders")}
    >
      <HiOutlineClipboardDocumentList /> Order History
    </button>
    <button
      className={activeTab === "trades" ? "active" : ""}
      onClick={() => setActiveTab("trades")}
    >
      <HiOutlineArrowsRightLeft /> Trade History
    </button>
  </div>
);

// --- MAIN PORTFOLIO PAGE COMPONENT ---

const PortfolioPage = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("positions");
  const [orderHistory, setOrderHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Get wallet connection and blockchain data
  const { address, isConnected } = useAccount();
  const { positions, isLoading: positionsLoading } = useAllPositions();
  const { accountValue, isLoading: accountLoading } = useAccountValue();

  useEffect(() => {
    // Fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for authentication state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch user profile when the session is available
    if (session?.user) {
      supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) console.warn("Error fetching profile:", error.message);
          if (data) setProfile(data);
        });
    }
  }, [session]);

  useEffect(() => {
    // Fetch order history from Supabase (if you have this table)
    if (address) {
      supabase
        .from("orders")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (error) console.warn("Error fetching orders:", error.message);
          if (data) setOrderHistory(data);
        });

      // Fetch trade history from Supabase (if you have this table)
      supabase
        .from("trades")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (error) console.warn("Error fetching trades:", error.message);
          if (data) setTradeHistory(data);
        });
    }
  }, [address]);

  const renderContent = () => {
    switch (activeTab) {
      case "positions":
        return (
          <div className="table-container">
            {positionsLoading ? (
              <div className="loading-state">Loading positions...</div>
            ) : positions.length === 0 ? (
              <div className="empty-state">No open positions</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Entry Price</th>
                    <th>Margin</th>
                    <th>Realized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.marketId}>
                      <td>{pos.marketName}</td>
                      <td className={pos.isLong ? "text-green" : "text-red"}>
                        <div className="side-cell">
                          {pos.isLong ? <HiArrowUp /> : <HiArrowDown />}{" "}
                          {pos.isLong ? "Long" : "Short"}
                        </div>
                      </td>
                      <td>{Math.abs(parseFloat(pos.size)).toFixed(4)}</td>
                      <td>${parseFloat(pos.entryPriceX18).toFixed(2)}</td>
                      <td>${parseFloat(pos.margin).toFixed(2)}</td>
                      <td
                        className={
                          parseFloat(pos.realizedPnL) >= 0
                            ? "text-green"
                            : "text-red"
                        }
                      >
                        ${parseFloat(pos.realizedPnL).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case "orders":
        return (
          <div className="table-container">
            {orderHistory.length === 0 ? (
              <div className="empty-state">No order history available</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Market</th>
                    <th>Type</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((order, index) => (
                    <tr key={index}>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{order.market}</td>
                      <td>{order.order_type}</td>
                      <td
                        className={
                          order.side === "Buy" ? "text-green" : "text-red"
                        }
                      >
                        {order.side}
                      </td>
                      <td>${parseFloat(order.price).toLocaleString()}</td>
                      <td>{order.amount}</td>
                      <td>
                        <span
                          className={`status-badge status-${order.status.toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case "trades":
        return (
          <div className="table-container">
            {tradeHistory.length === 0 ? (
              <div className="empty-state">No trade history available</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Market</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade, index) => (
                    <tr key={index}>
                      <td>{new Date(trade.created_at).toLocaleString()}</td>
                      <td>{trade.market}</td>
                      <td
                        className={
                          trade.side === "Buy" ? "text-green" : "text-red"
                        }
                      >
                        {trade.side}
                      </td>
                      <td>${parseFloat(trade.price).toLocaleString()}</td>
                      <td>{trade.amount}</td>
                      <td>${parseFloat(trade.fee).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate portfolio metrics from real data
  const totalValue = parseFloat(accountValue) || 0;
  const totalMargin = positions.reduce(
    (sum, pos) => sum + parseFloat(pos.margin),
    0
  );
  const totalPnL = positions.reduce(
    (sum, pos) => sum + parseFloat(pos.realizedPnL),
    0
  );
  const availableMargin = totalValue - totalMargin;
  const buyingPower = totalValue * 10; // Assuming 10x leverage

  // For 24h P&L, you'd need to store historical data or calculate from price changes
  // This is a placeholder - ideally fetch from your backend
  const pnl24h = totalPnL; // You can improve this later
  const pnl24hPercent =
    totalValue > 0 ? ((pnl24h / totalValue) * 100).toFixed(2) : 0;

  if (!isConnected) {
    return (
      <main className="portfolio-page-main">
        <div className="not-connected-state">
          <h2>Please connect your wallet to view your portfolio</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="portfolio-page-main">
      <PortfolioHeader
        username={profile?.username}
        portfolioValue={totalValue}
        pnl={pnl24h}
        pnlPercent={pnl24hPercent}
      />
      <AccountSummary
        availableMargin={availableMargin}
        totalCollateral={totalValue}
        buyingPower={buyingPower}
      />
      <div className="portfolio-content-panel">
        <HistoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {renderContent()}
      </div>
    </main>
  );
};

export default PortfolioPage;
