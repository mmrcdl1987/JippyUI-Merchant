import { useMemo, useState } from "react";
import {
  FaChevronDown,
  FaCalendarAlt,
  FaRupeeSign,
  FaShoppingCart,
  FaLayerGroup,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaClock,
  FaArrowRight,
  FaArrowUp,
  FaHeart,
} from "react-icons/fa";
import "../../styles/Dashboard.css";

// ---------------------------------------------------------------------
// Mock data — static for now, swap for API responses later. Nothing
// below the constants should need to change: figures, chart scaling
// and donut percentages are all derived from this data.
// ---------------------------------------------------------------------

const TIME_FILTERS = ["All Time", "Today", "This Year", "This Month", "This Week"];

const MONTHLY_SALES = [
  { month: "Jan", value: 17280 },
  { month: "Feb", value: 1440 },
  { month: "Mar", value: 4500 },
  { month: "Apr", value: 540 },
  { month: "May", value: 720 },
  { month: "Jun", value: 9360 },
  { month: "Jul", value: 2160 },
  { month: "Aug", value: 360 },
  { month: "Sep", value: 180 },
  { month: "Oct", value: 180 },
  { month: "Nov", value: 180 },
  { month: "Dec", value: 180 },
];

const ORDER_STATUS = [
  { key: "placed", label: "Order Placed", count: 0, colorVar: "--jmdash-status-placed", icon: FaBoxOpen },
  { key: "accepted", label: "Order Accepted", count: 0, colorVar: "--jmdash-status-accepted", icon: FaCheckCircle },
  { key: "completed", label: "Order Completed", count: 241, colorVar: "--jmdash-status-completed", icon: FaCheckCircle },
  { key: "rejected", label: "Order Rejected", count: 18, colorVar: "--jmdash-status-rejected", icon: FaTimesCircle },
  { key: "canceled", label: "Order Canceled", count: 0, colorVar: "--jmdash-status-canceled", icon: FaTimes },
];

const RECENT_ORDERS = [
  { id: "Jippy33005248", client: "Chandana", type: "Order Delivery", amount: 7, qty: 1, date: "31 Aug 2026, 5:47 PM", status: "rejected" },
  { id: "Jippy33005099", client: "Rohan", type: "Order Delivery", amount: 28, qty: 4, date: "13 Aug 2026, 5:27 PM", status: "completed" },
  { id: "Jippy33005098", client: "Khalid", type: "Order Delivery", amount: 7, qty: 1, date: "13 Aug 2026, 5:18 PM", status: "completed" },
  { id: "Jippy33005097", client: "Mayuri", type: "Order Delivery", amount: 7, qty: 1, date: "13 Aug 2026, 5:17 PM", status: "pending" },
  { id: "Jippy33005041", client: "Paxton", type: "Order Delivery", amount: 7, qty: 1, date: "08 Aug 2026, 5:31 PM", status: "completed" },
  { id: "Jippy33005039", client: "Fabiola", type: "Order Delivery", amount: 7, qty: 1, date: "08 Aug 2026, 5:08 PM", status: "pending" },
];

const TOTAL_EARNINGS = 284002;
const TOTAL_ORDERS = 283;
const TOTAL_FOODS = 5;

const STAT_CARDS = [
  { key: "earnings", label: "Total earnings", icon: FaRupeeSign, value: TOTAL_EARNINGS, isCurrency: true, change: "+12%", tone: "purple" },
  { key: "orders", label: "Total Orders", icon: FaShoppingCart, value: TOTAL_ORDERS, isCurrency: false, change: "+8%", tone: "blue" },
  { key: "foods", label: "Total Foods", icon: FaLayerGroup, value: TOTAL_FOODS, isCurrency: false, change: "+0%", tone: "green" },
];

const STATUS_BADGE_META = {
  completed: { label: "Order Completed", className: "jmdash-badge--completed" },
  rejected: { label: "Order Rejected", className: "jmdash-badge--rejected" },
  pending: { label: "Pending", className: "jmdash-badge--pending" },
};

// Column widths shared by <thead> and <tbody> via <colgroup>, so the two
// rows can never drift apart regardless of content length or any global
// table styles the host app may already define.
const TABLE_COLUMNS = [
  { key: "id", label: "Order ID", width: "16%" },
  { key: "client", label: "Client", width: "18%" },
  { key: "type", label: "Order Type", width: "16%" },
  { key: "amount", label: "Amount", width: "10%" },
  { key: "qty", label: "Quantity", width: "10%" },
  { key: "date", label: "Order Date", width: "16%" },
  { key: "status", label: "Order Status", width: "14%" },
];

const formatCurrency = (value) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState(TIME_FILTERS[0]);
  const [salesRange, setSalesRange] = useState("This year");

  const totalOrdersFromStatus = useMemo(
    () => ORDER_STATUS.reduce((sum, s) => sum + s.count, 0),
    []
  );

  const salesMax = Math.max(...MONTHLY_SALES.map((m) => m.value));
  const salesTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round((salesMax * f) / 100) * 100);

  // "Service Overview" — Total Orders vs Total Foods, as a donut.
  const serviceTotal = TOTAL_ORDERS + TOTAL_FOODS;
  const serviceOrdersPct = (TOTAL_ORDERS / serviceTotal) * 100;
  const serviceDonut = `conic-gradient(
    var(--jmdash-donut-green) 0% ${serviceOrdersPct}%,
    var(--jmdash-donut-purple) ${serviceOrdersPct}% 100%
  )`;

  // "Sales Overview" — a single metric (Total Earnings), shown as a
  // full ring with a gradient sweep so it isn't just a flat circle.
  const salesDonut =
    "conic-gradient(from 0deg, var(--jmdash-donut-orange-light), var(--jmdash-donut-orange), var(--jmdash-donut-orange-light))";

  return (
    <div className="jmdash-page">
      {/* ================= WELCOME ================= */}
      <div className="jmdash-welcome-row">
        <div className="jmdash-welcome-text">
          <h1 className="jmdash-welcome-title">Good Afternoon, Dhanush! 👋</h1>
          <p className="jmdash-welcome-sub">Here&apos;s what&apos;s happening with your restaurant today.</p>
        </div>

        {/* <div className="jmdash-welcome-banner">
          <p className="jmdash-banner-line1">Fresh food</p>
          <p className="jmdash-banner-line2">
            Happy moods <FaHeart />
          </p>
        </div> */}

        <div className="jmdash-filter">
          <FaCalendarAlt className="jmdash-filter-calendar" />
          <select
            className="jmdash-filter-select"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            aria-label="Time range"
          >
            {TIME_FILTERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <FaChevronDown className="jmdash-filter-chevron" aria-hidden="true" />
        </div>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="jmdash-stat-grid">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div className={`jmdash-stat-card jmdash-stat-card--${s.tone}`} key={s.key}>
              <span className="jmdash-stat-circle">
                <Icon />
              </span>

              <div className="jmdash-stat-body">
                <div className="jmdash-stat-card-row">
                  <span className="jmdash-stat-label">{s.label}</span>
                  <span className="jmdash-stat-badge">
                    <Icon />
                  </span>
                </div>
                <span className="jmdash-stat-figure">
                  {s.isCurrency ? formatCurrency(s.value) : s.value}
                </span>
                {/* <span className="jmdash-stat-change">
                  <FaArrowUp /> {s.change} from last period
                </span> */}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= ORDER STATUS ================= */}
      <div className="jmdash-status-grid">
        {ORDER_STATUS.map((s) => {
          const Icon = s.icon;
          return (
            <div className={`jmdash-status-card jmdash-status-card--${s.key}`} key={s.key}>
              <span className="jmdash-status-icon" style={{ color: `var(${s.colorVar})` }}>
                <Icon />
              </span>
              <span className="jmdash-status-label">{s.label}</span>
              <span className="jmdash-status-count" style={{ color: `var(${s.colorVar})` }}>
                {s.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* ================= CHARTS ================= */}
      <div className="jmdash-charts-grid">
        <div className="jmdash-chart-card">
          <div className="jmdash-chart-head">
            <h2 className="jmdash-chart-title">
              <FaLayerGroup className="jmdash-chart-title-icon" /> Total Sales
            </h2>
            <div className="jmdash-chart-select">
              <select value={salesRange} onChange={(e) => setSalesRange(e.target.value)}>
                <option>This year</option>
                <option>Last year</option>
              </select>
              <FaChevronDown />
            </div>
          </div>

          <div className="jmdash-sales-chart">
            <div className="jmdash-sales-y-axis">
              {salesTicks.map((t) => (
                <span key={t}>₹{t.toLocaleString("en-IN")}</span>
              ))}
            </div>

            <div className="jmdash-sales-bars">
              {MONTHLY_SALES.map((m) => (
                <div className="jmdash-sales-bar-item" key={m.month}>
                  <div
                    className="jmdash-sales-bar"
                    style={{ height: `${(m.value / salesMax) * 100}%` }}
                    title={`${m.month}: ${formatCurrency(m.value)}`}
                  />
                  <small>{m.month.toUpperCase()}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="jmdash-chart-legend">
            <span className="jmdash-legend-swatch jmdash-legend-swatch--purple" />
            <span>This year</span>
          </div>
        </div>

        <div className="jmdash-chart-card jmdash-chart-card--donut">
          <h2 className="jmdash-chart-title">
            <FaClock className="jmdash-chart-title-icon" /> Service Overview
          </h2>

          <div className="jmdash-donut-row">
            <div className="jmdash-donut-wrap">
              <div className="jmdash-donut" style={{ backgroundImage: serviceDonut }}>
                <div className="jmdash-donut-hole">
                  <span className="jmdash-donut-figure">{serviceTotal}</span>
                  <span className="jmdash-donut-caption">Total</span>
                </div>
              </div>
            </div>

            <div className="jmdash-chart-legend jmdash-chart-legend--col">
              <span className="jmdash-legend-item">
                <span className="jmdash-legend-swatch jmdash-legend-swatch--green" />
                Total Orders
              </span>
              <span className="jmdash-legend-item">
                <span className="jmdash-legend-swatch jmdash-legend-swatch--violet" />
                Total Foods
              </span>
            </div>
          </div>
        </div>

        <div className="jmdash-chart-card jmdash-chart-card--donut">
          <h2 className="jmdash-chart-title">
            <FaArrowUp className="jmdash-chart-title-icon" /> Sales Overview
          </h2>

          <div className="jmdash-donut-row">
            <div className="jmdash-donut-wrap">
              <div className="jmdash-donut" style={{ backgroundImage: salesDonut }}>
                <div className="jmdash-donut-hole">
                  <span className="jmdash-donut-figure">{formatCurrency(TOTAL_EARNINGS)}</span>
                  <span className="jmdash-donut-caption">Total</span>
                </div>
              </div>
            </div>

            <div className="jmdash-chart-legend jmdash-chart-legend--col">
              <span className="jmdash-legend-item">
                <span className="jmdash-legend-swatch jmdash-legend-swatch--orange" />
                Total Earnings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT ORDERS ================= */}
      <div className="jmdash-recent-card">
        <div className="jmdash-recent-header">
          <h2 className="jmdash-recent-title">
            <FaClock className="jmdash-recent-title-icon" /> Recent Orders
          </h2>
          <button type="button" className="jmdash-view-all-btn">
            View all <FaArrowRight />
          </button>
        </div>

        <div className="jmdash-table-wrapper">
          <table className="jmdash-table">
            <colgroup>
              {TABLE_COLUMNS.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                {TABLE_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {RECENT_ORDERS.map((order) => {
                const meta = STATUS_BADGE_META[order.status];
                return (
                  <tr key={order.id}>
                    <td className="jmdash-cell-id">{order.id}</td>
                    <td className="jmdash-cell-client">{order.client}</td>
                    <td className="jmdash-cell-type">
                      <FaShoppingCart /> {order.type}
                    </td>
                    <td className="jmdash-cell-amount">₹{order.amount.toFixed(2)}</td>
                    <td className="jmdash-cell-qty">
                      <FaShoppingCart /> {order.qty}
                    </td>
                    <td className="jmdash-cell-date">{order.date}</td>
                    <td className="jmdash-cell-status">
                      <span className={`jmdash-badge ${meta.className}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;