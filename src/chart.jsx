import React, { useState, useEffect, useRef } from "react";
import Chart from "react-apexcharts";
import { supabase } from "./creatclient";

const PriceIndexChart = () => {
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [priceChangeLabel, setPriceChangeLabel] = useState("24h");
  const [chartData, setChartData] = useState([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [priceChangePercent, setPriceChangePercent] = useState(null);

  // --- UPDATED: Add '15d' as a possible state ---
  const [timeRange, setTimeRange] = useState("24h"); // '24h', '5d', or '15d'
  const lastDisplayedDateRef = useRef(null);
  const isPriceUp = priceChange !== null && priceChange >= 0;

  useEffect(() => {
    lastDisplayedDateRef.current = null;
    const fetchData = async () => {
      setLoading(true);
      try {
        // --- UPDATED: New query logic to handle the 'max' case ---
        let query = supabase.from("price_data").select("price, timestamp");

        // Only apply a time filter if the range is NOT 'max'
        if (timeRange !== "max") {
          let hoursAgo;
          if (timeRange === "15d") hoursAgo = 15 * 24;
          else if (timeRange === "5d") hoursAgo = 5 * 24;
          else hoursAgo = 24; // Default to 24h

          const startTime = new Date(
            Date.now() - hoursAgo * 60 * 60 * 1000
          ).toISOString();
          query = query.gte("timestamp", startTime);
        }

        // Always order the results
        const { data, error } = await query.order("timestamp", {
          ascending: true,
        });

        if (error) throw error;
        if (!data || data.length < 2)
          throw new Error("Not enough historical data for this range.");

        setHasEnoughData(true);

        const latestEntry = data[data.length - 1];
        const livePrice = parseFloat(latestEntry.price);
        setCurrentPrice(livePrice);

        const openingEntry = data[0];
        const openingPrice = parseFloat(openingEntry.price);
        const absoluteChange = livePrice - openingPrice;
        setPriceChange(absoluteChange);

        if (openingPrice !== 0) {
          const percentChange = (absoluteChange / openingPrice) * 100;
          setPriceChangePercent(percentChange);
        } else {
          setPriceChangePercent(0);
        }

        setPriceChangeLabel(timeRange);

        const formattedChartData = data.map((d) => ({
          x: new Date(d.timestamp),
          y: parseFloat(d.price),
        }));
        setChartData(formattedChartData);
      } catch (error) {
        console.error("Error fetching price data:", error.message);
        setCurrentPrice("N/A");
        setHasEnoughData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);
  const chartOptions = {
    chart: {
      type: "area",
      height: 350,
      zoom: { enabled: false },
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: { colors: "#a0aec0" },
        // --- UPDATED: Format correctly for all ranges ---
        format: timeRange === "24h" ? "HH:mm" : "MMM dd",
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#a0aec0" },
        formatter: (val) => `$${val.toFixed(3)}`,
      },
      opposite: true,
    },
    grid: { borderColor: "#4a5568", strokeDashArray: 4 },
    tooltip: { theme: "dark", x: { format: "MMM dd, HH:mm" } },
    colors: ["#007BFF"],
  };

  return (
    <section id="price-index" className="price-index-section">
      <div className="content-container">
        <div className="price-display-header">
          <div className="price-title">
            <h2>ByteStrike H-100 Rental Index Price</h2>
          </div>
          <div className="price-value">
            <h4>Last Price</h4>
            <div className="price-main">
              <h1>
                {loading
                  ? "..."
                  : typeof currentPrice === "number"
                  ? `$${currentPrice.toFixed(2)}`
                  : "N/A"}
              </h1>
              {hasEnoughData &&
                priceChange !== null &&
                priceChangePercent !== null && (
                  <div
                    className={`price-change-chip ${
                      isPriceUp ? "price-up" : "price-down"
                    }`}
                  >
                    <span className="absolute-change">
                      {isPriceUp ? "▲" : "▼"} $
                      {Math.abs(priceChange).toFixed(2)}
                    </span>
                    <span className="percent-change">
                      ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* --- UPDATED: Add the new "15 Days" button --- */}
        <div className="time-range-toggles">
          <button
            onClick={() => setTimeRange("24h")}
            className={timeRange === "24h" ? "active" : ""}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange("5d")}
            className={timeRange === "5d" ? "active" : ""}
          >
            5 Days
          </button>
          <button
            onClick={() => setTimeRange("15d")}
            className={timeRange === "15d" ? "active" : ""}
          >
            15 Days
          </button>
          <button
            onClick={() => setTimeRange("max")}
            className={timeRange === "max" ? "active" : ""}
          >
            Max
          </button>
        </div>

        <div id="price-chart-container">
          {loading ? (
            <p className="chart-message">Loading Chart Data...</p>
          ) : hasEnoughData ? (
            <Chart
              options={chartOptions}
              series={[{ name: "Price", data: chartData }]}
              type="area"
              height={350}
            />
          ) : (
            <div className="chart-message-container">
              <p className="chart-message">
                Not enough data for this time range. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PriceIndexChart;
