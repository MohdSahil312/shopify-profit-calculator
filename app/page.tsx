"use client";
// Logo is served from /public/shopify-logo.svg

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CurrencyOption { code: string; symbol: string; label: string; locale: string; }
interface InputField {
  id: string; label: string; desc: string; icon: string;
  isCurrency?: boolean; isPercent?: boolean;
  min: number; max: number; step: number; defaultValue: number;
  validationMsg: string;
}
interface Metrics {
  revenue: number; gatewayFeeAmt: number; totalCost: number;
  netProfit: number; profitMargin: number; roi: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$",    label: "$ USD", locale: "en-US" },
  { code: "INR", symbol: "₹",    label: "₹ INR", locale: "en-IN" },
  { code: "AED", symbol: "د.إ",  label: "د.إ AED", locale: "en-AE" },
];

const FIELDS: InputField[] = [
  { id: "sellingPrice", label: "Selling Price",        desc: "What the customer pays",        icon: "💰", isCurrency: true,  min: 0.01, max: 10000, step: 0.01, defaultValue: 49.99, validationMsg: "Selling price must be > 0." },
  { id: "productCost",  label: "Product Cost",         desc: "Source or manufacturing cost",  icon: "📦", isCurrency: true,  min: 0,    max: 10000, step: 0.01, defaultValue: 12.00, validationMsg: "Cannot be negative." },
  { id: "shippingCost", label: "Shipping Cost",        desc: "Delivery to customer",          icon: "🚚", isCurrency: true,  min: 0,    max: 1000,  step: 0.01, defaultValue: 4.50,  validationMsg: "Cannot be negative." },
  { id: "adCost",       label: "Ad Spend (per order)", desc: "Average marketing cost",        icon: "📣", isCurrency: true,  min: 0,    max: 1000,  step: 0.01, defaultValue: 8.00,  validationMsg: "Cannot be negative." },
  { id: "gatewayFee",   label: "Payment Gateway Fee",  desc: "Shopify Payments / Stripe rate",icon: "💳", isPercent: true,   min: 0,    max: 20,    step: 0.01, defaultValue: 2.90,  validationMsg: "Must be 0–20%." },
];

const DEFAULTS = Object.fromEntries(FIELDS.map((f) => [f.id, f.defaultValue]));

const PRESETS = [
  { label: "Low Ticket",  sub: "< $50",      values: { sellingPrice: 19.99, productCost: 4,  shippingCost: 3,   adCost: 5,  gatewayFee: 2.9 } },
  { label: "Mid Ticket",  sub: "$50 – $200", values: { sellingPrice: 49.99, productCost: 12, shippingCost: 4.5, adCost: 8,  gatewayFee: 2.9 } },
  { label: "High Ticket", sub: "> $200",     values: { sellingPrice: 149.99,productCost: 35, shippingCost: 8,   adCost: 25, gatewayFee: 2.9 } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fc(value: number, cur: CurrencyOption): string {
  try {
    return new Intl.NumberFormat(cur.locale, { style: "currency", currency: cur.code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  } catch { return `${cur.symbol}${value.toFixed(2)}`; }
}
function fp(v: number, d = 1) { return `${v.toFixed(d)}%`; }

// ─────────────────────────────────────────────────────────────────────────────
// Shopify Logo — uses uploaded /public/shopify-logo.svg
// ─────────────────────────────────────────────────────────────────────────────
function ShopifyLogo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/shopify-logo.svg"
      alt="Shopify logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function CurrencyDropdown({ selected, onChange, dark }: { selected: CurrencyOption; onChange: (c: CurrencyOption) => void; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        suppressHydrationWarning
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
          dark ? "bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-400"
               : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm"
        }`}
      >
        <span>{selected.label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""} ${dark ? "text-slate-400" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-1.5 w-36 rounded-xl border shadow-xl z-50 overflow-hidden ${
          dark ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"
        }`}>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              suppressHydrationWarning
              onClick={() => { onChange(c); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                c.code === selected.code
                  ? "bg-[#95BF47] text-white"
                  : dark
                  ? "text-slate-200 hover:bg-slate-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color, dark }: {
  label: string; value: string; sub: string; icon: string;
  color: "green" | "red" | "blue" | "gray"; dark: boolean;
}) {
  const colors = {
    green: "text-[#10B981]",
    red:   "text-[#EF4444]",
    blue:  "text-[#3B82F6]",
    gray:  dark ? "text-slate-200" : "text-gray-900",
  };
  const iconBg = {
    green: dark ? "bg-emerald-900/50" : "bg-emerald-50",
    red:   dark ? "bg-red-900/40"     : "bg-red-50",
    blue:  dark ? "bg-blue-900/40"    : "bg-blue-50",
    gray:  dark ? "bg-slate-700"      : "bg-gray-50",
  };

  return (
    <div className={`${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"} border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-slate-400" : "text-gray-400"}`}>{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${iconBg[color]}`}>{icon}</span>
      </div>
      <div className={`text-2xl font-extrabold tracking-tight ${colors[color]}`}>{value}</div>
      <div className={`text-xs ${dark ? "text-slate-500" : "text-gray-400"}`}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input Row
// ─────────────────────────────────────────────────────────────────────────────
function InputRow({ field, value, onChange, error, dark, currSym }: {
  field: InputField; value: number; onChange: (id: string, v: number) => void;
  error?: string; dark: boolean; currSym: string;
}) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sliderMax = field.isPercent ? field.max : Math.min(field.max, Math.max(value * 4, 200));
  const pct = Math.min(100, ((value - 0) / (sliderMax - 0)) * 100);

  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);

  const commit = (s: string) => {
    const p = parseFloat(s);
    if (isNaN(p)) { setRaw(String(value)); return; }
    const c = Math.min(Math.max(p, 0), field.max);
    setRaw(String(c)); onChange(field.id, c);
  };

  return (
    <div className={`py-4 border-b last:border-b-0 ${dark ? "border-slate-700" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5 ${dark ? "bg-slate-700" : "bg-gray-50"}`}>
          {field.icon}
        </div>

        {/* Label + Slider */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 mb-0.5">
            <span className={`text-sm font-semibold ${dark ? "text-slate-100" : "text-gray-800"}`}>{field.label}</span>
            <span className={`text-xs ${dark ? "text-slate-500" : "text-gray-400"}`}>{field.desc}</span>
          </div>
          <input
            type="range" min={0} max={sliderMax} step={field.step} value={value}
            suppressHydrationWarning
            onChange={(e) => { const v = parseFloat(e.target.value); onChange(field.id, v); setRaw(String(v)); }}
            aria-label={`${field.label} slider`}
            className="w-full mt-2"
            style={{ background: `linear-gradient(to right, #95BF47 ${pct}%, #E5E7EB ${pct}%)`, borderRadius: 999, height: 4 }}
          />
          {error && <p role="alert" className="mt-1 text-xs text-red-500 flex gap-1"><span>⚠</span>{error}</p>}
        </div>

        {/* Input box */}
        <div className={`flex items-center gap-1 rounded-xl border px-3 py-2 w-24 sm:w-28 shrink-0 transition-all ${
          error ? "border-red-400 bg-red-50"
          : focused ? dark ? "border-[#95BF47] bg-slate-700 shadow-[0_0_0_3px_rgba(149,191,71,0.15)]"
                           : "border-[#95BF47] bg-white shadow-[0_0_0_3px_rgba(149,191,71,0.12)]"
          : dark ? "border-slate-600 bg-slate-700 hover:border-slate-500"
                 : "border-gray-200 bg-white hover:border-gray-300"
        }`}>
          {field.isCurrency && <span className={`text-xs font-semibold shrink-0 ${focused ? "text-[#95BF47]" : dark ? "text-slate-400" : "text-gray-400"}`}>{currSym}</span>}
          <input
            id={field.id} type="number" inputMode="decimal"
            min={field.min} max={field.max} step={field.step}
            value={raw}
            suppressHydrationWarning
            onChange={(e) => { setRaw(e.target.value); const p = parseFloat(e.target.value); if (!isNaN(p)) onChange(field.id, p); }}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); commit(raw); }}
            aria-label={field.label}
            className={`w-full bg-transparent text-sm font-bold focus:outline-none ${dark ? "text-slate-100" : "text-gray-900"}`}
          />
          {field.isPercent && <span className={`text-xs font-semibold shrink-0 ${focused ? "text-[#95BF47]" : dark ? "text-slate-400" : "text-gray-400"}`}>%</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfitCalculator() {
  const [dark, setDark] = useState(false);
  const [currency, setCurrency] = useState<CurrencyOption>(CURRENCIES[0]);
  const [values, setValues] = useState<Record<string, number>>(DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetMargin, setTargetMargin] = useState(40);
  const [toast, setToast] = useState(false);

  const validate = useCallback((vals: Record<string, number>) => {
    const e: Record<string, string> = {};
    FIELDS.forEach((f) => {
      const v = vals[f.id];
      if (f.id === "sellingPrice" && (isNaN(v) || v <= 0)) e[f.id] = f.validationMsg;
      else if (f.id === "gatewayFee" && (v < 0 || v > 20)) e[f.id] = f.validationMsg;
      else if (v < 0) e[f.id] = f.validationMsg;
    });
    return e;
  }, []);

  const handleChange = useCallback((id: string, val: number) => {
    setValues((prev) => { const next = { ...prev, [id]: val }; setErrors(validate(next)); return next; });
  }, [validate]);

  const handleReset = () => { setValues(DEFAULTS); setErrors({}); };

  const m = useMemo<Metrics>(() => {
    const { sellingPrice: sp, productCost: pc, shippingCost: sc, adCost: ac, gatewayFee: gf } = values;
    const revenue = sp;
    const gatewayFeeAmt = (gf / 100) * revenue;
    const totalCost = pc + sc + ac + gatewayFeeAmt;
    const netProfit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    return { revenue, gatewayFeeAmt, totalCost, netProfit, profitMargin, roi };
  }, [values]);

  // Suggested price: Price = VariableCosts / (1 - targetMargin% - gatewayFee%)
  const suggestedPrice = useMemo(() => {
    const { productCost: pc, shippingCost: sc, adCost: ac, gatewayFee: gf } = values;
    const variableCosts = pc + sc + ac;
    const denominator = 1 - targetMargin / 100 - gf / 100;
    if (denominator <= 0) return null;
    return variableCosts / denominator;
  }, [values, targetMargin]);

  const hasErrors = Object.keys(errors).length > 0;
  const isProfit = m.netProfit >= 0;

  const marginConfig =
    m.profitMargin >= 40 ? { badge: "Excellent", color: "text-[#10B981]", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200", insight: "Your margins are healthy. Consider increasing ad spend to scale revenue and accelerate growth." }
    : m.profitMargin >= 25 ? { badge: "Good", color: "text-[#95BF47]", badgeBg: "bg-lime-50 text-lime-700 border-lime-200", insight: "Solid profitability. Monitor advertising efficiency and shipping costs to protect your margin." }
    : m.profitMargin >= 10 ? { badge: "Thin", color: "text-[#F59E0B]", badgeBg: "bg-amber-50 text-amber-700 border-amber-200", insight: "Margins are tight. Consider negotiating better product costs or optimizing your ad spend to improve efficiency." }
    : { badge: "Loss", color: "text-[#EF4444]", badgeBg: "bg-red-50 text-red-700 border-red-200", insight: "This product is unprofitable. Increase your selling price or reduce acquisition and product costs." };

  const copyResults = async () => {
    const lines = [
      "── Shopify Profit Calculator Results ──",
      `Selling Price   : ${fc(m.revenue, currency)}`,
      `Product Cost    : -${fc(values.productCost, currency)}`,
      `Shipping        : -${fc(values.shippingCost, currency)}`,
      `Ad Spend        : -${fc(values.adCost, currency)}`,
      `Gateway Fee     : -${fc(m.gatewayFeeAmt, currency)} (${values.gatewayFee}%)`,
      "────────────────────────────────────────",
      `Total Cost      : ${fc(m.totalCost, currency)}`,
      `Net Profit      : ${fc(m.netProfit, currency)}`,
      `Profit Margin   : ${fp(m.profitMargin)}`,
      `ROI             : ${fp(m.roi)}`,
      "────────────────────────────────────────",
      "digitalheroesco.com",
    ].join("\n");
    try { await navigator.clipboard.writeText(lines); setToast(true); setTimeout(() => setToast(false), 3000); } catch { /**/ }
  };

  // Breakdown segments
  const safe = (v: number) => Math.max(0, v);
  const pct = (v: number) => m.revenue > 0 ? (safe(v) / m.revenue) * 100 : 0;
  const breakdown = [
    { label: "Product",  value: values.productCost, color: "bg-violet-500", dot: "bg-violet-500" },
    { label: "Shipping", value: values.shippingCost, color: "bg-sky-500",    dot: "bg-sky-500" },
    { label: "Ad Spend", value: values.adCost,        color: "bg-amber-500",  dot: "bg-amber-500" },
    { label: "Gateway",  value: m.gatewayFeeAmt,      color: "bg-rose-400",   dot: "bg-rose-400" },
    { label: "Profit",   value: m.netProfit,           color: isProfit ? "bg-[#95BF47]" : "bg-red-500", dot: isProfit ? "bg-[#95BF47]" : "bg-red-500" },
  ];

  // ── Theme tokens
  const bg   = dark ? "bg-[#0F172A]" : "bg-[#F8FAFC]";
  const card = dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200";
  const tp   = dark ? "text-slate-100" : "text-gray-900";
  const ts   = dark ? "text-slate-400" : "text-gray-500";
  const nav  = dark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen flex flex-col ${bg} transition-colors duration-300`}>

      {/* ════════════════════ STICKY NAVBAR ════════════════════ */}
      <header className={`sticky top-0 z-50 border-b ${nav} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <ShopifyLogo size={26} />
            <span className={`text-base font-bold tracking-tight hidden sm:block ${tp}`}>
              Shopify <span className="text-[#95BF47]">Profit Calculator</span>
            </span>
            <span className={`text-sm font-bold sm:hidden ${tp}`}>Profit Calc</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <CurrencyDropdown selected={currency} onChange={setCurrency} dark={dark} />

            {/* Theme toggle */}
            <button
              suppressHydrationWarning
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? "Light mode" : "Dark mode"}
              className={`flex items-center gap-1.5 w-8 h-8 justify-center rounded-lg border cursor-pointer transition-all ${
                dark ? "bg-slate-700 border-slate-600 text-yellow-300 hover:bg-slate-600"
                     : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className={`border-b ${dark ? "border-slate-700" : "border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${dark ? "bg-[#95BF47]/10 text-[#95BF47] border border-[#95BF47]/20" : "bg-[#F0F7E6] text-[#5E8E3E] border border-[#95BF47]/30"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#95BF47] animate-pulse" />
              Free Shopify Tool
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight tracking-tight mb-4 ${tp}`}>
              Calculate Your Real<br />
              <span className="text-[#95BF47]">Shopify Profit</span>
            </h1>
            <p className={`text-base sm:text-lg leading-relaxed mb-7 max-w-lg ${ts}`}>
              Know exactly how much you keep after product costs, shipping, advertising spend, and payment gateway fees.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {["✓ Real-Time Calculations","✓ ROI Tracking","✓ Profit Insights","✓ Ecommerce Focused"].map((pill) => (
                <span key={pill} className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border ${
                  dark ? "bg-[#95BF47]/10 border-[#95BF47]/20 text-[#95BF47]"
                       : "bg-[#F0F7E6] border-[#95BF47]/30 text-[#5E8E3E]"
                }`}>{pill}</span>
              ))}
            </div>
          </div>
          {/* Illustration */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-80 h-64">
              <Image src="/hero-illustration.png" alt="Shopify profit calculator illustration" fill style={{ objectFit: "contain" }} priority />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ MAIN CALCULATOR ════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs (40%) ── */}
          <div className="xl:col-span-2">
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
              {/* Card header */}
              <div className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b ${dark ? "border-slate-700" : "border-gray-100"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${dark ? "" : ""}`}>🧮</span>
                    <h2 className={`text-base font-bold ${tp}`}>Your Numbers</h2>
                  </div>
                  <p className={`text-xs mt-0.5 ${ts}`}>Enter your costs and pricing details</p>
                </div>
                <button
                  id="reset-button"
                  suppressHydrationWarning
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all text-[#95BF47] border-[#95BF47]/30 hover:bg-[#95BF47]/10"
                >
                  ↺ Reset
                </button>
              </div>

              {/* Error banner */}
              {hasErrors && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-200">
                  <p className="text-xs font-semibold text-red-600">⚠ Fix errors: {Object.values(errors).join(" · ")}</p>
                </div>
              )}

              {/* Input fields */}
              <div className="px-5 sm:px-6">
                {FIELDS.map((f) => (
                  <InputRow key={f.id} field={f} value={values[f.id]} onChange={handleChange} error={errors[f.id]} dark={dark} currSym={currency.symbol} />
                ))}
              </div>

              {/* Presets */}
              <div className={`px-5 sm:px-6 py-4 border-t ${dark ? "border-slate-700 bg-slate-800/50" : "border-gray-100 bg-gray-50/50"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${ts}`}>Quick Presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      id={`preset-${p.label.toLowerCase().replace(" ", "-")}`}
                      suppressHydrationWarning
                      onClick={() => { setValues(p.values); setErrors({}); }}
                      className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-center cursor-pointer transition-all hover:border-[#95BF47] hover:bg-[#95BF47]/5 ${dark ? "border-slate-600 bg-slate-700" : "border-gray-200 bg-white"}`}
                    >
                      <span className={`text-xs font-semibold ${tp}`}>{p.label}</span>
                      <span className={`text-[10px] mt-0.5 ${ts}`}>{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results (60%) ── */}
          <div className="xl:col-span-3 flex flex-col gap-5">

            {/* ── Profit Dashboard Card ── */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
              <div className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b ${dark ? "border-slate-700" : "border-gray-100"}`}>
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <div>
                    <h2 className={`text-base font-bold ${tp}`}>Profit Dashboard</h2>
                    <p className={`text-xs ${ts}`}>Live results based on your inputs</p>
                  </div>
                </div>
                <button
                  id="copy-results-button"
                  suppressHydrationWarning
                  onClick={copyResults}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[#95BF47] border-[#95BF47]/30 hover:bg-[#95BF47]/10"
                >
                  📋 Copy Results
                </button>
              </div>

              <div className="px-5 sm:px-6 py-5 space-y-5">
                {/* Net Profit Hero */}
                <div className={`rounded-2xl p-5 sm:p-6 text-center border ${
                  hasErrors
                    ? dark ? "border-slate-600 bg-slate-700/30" : "border-gray-200 bg-gray-50"
                    : isProfit
                    ? dark ? "border-emerald-700/30 bg-emerald-900/20" : "border-[#95BF47]/20 bg-[#F0F7E6]"
                    : dark ? "border-red-800/30 bg-red-900/20" : "border-red-200 bg-red-50"
                }`}>
                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${ts}`}>Net Profit Per Order</p>
                  <p className={`text-5xl sm:text-6xl font-extrabold tracking-tight ${
                    hasErrors ? ts : isProfit ? "text-[#95BF47]" : "text-[#EF4444]"
                  }`}>
                    {hasErrors ? "—" : fc(m.netProfit, currency)}
                  </p>
                  {!hasErrors && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${marginConfig.badgeBg}`}>
                        {marginConfig.badge} · {fp(m.profitMargin)} Margin
                      </span>
                    </div>
                  )}
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Revenue"     value={fc(m.revenue, currency)}   sub="Selling Price"         icon="📈" color="gray"  dark={dark} />
                  <MetricCard label="Total Cost"  value={fc(m.totalCost, currency)} sub="All Expenses"          icon="📉" color="red"   dark={dark} />
                  <MetricCard label="ROI"         value={fp(m.roi)}                  sub="Return on Cost"        icon="🎯" color={isProfit ? "green" : "red"} dark={dark} />
                  <MetricCard label="Gateway Fee" value={fc(m.gatewayFeeAmt, currency)} sub={`${values.gatewayFee}% of Revenue`} icon="💳" color="blue" dark={dark} />
                </div>
              </div>
            </div>

            {/* ── Cost Breakdown Card ── */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
              <div className={`flex items-center gap-2 px-5 sm:px-6 py-4 border-b ${dark ? "border-slate-700" : "border-gray-100"}`}>
                <span>📊</span>
                <h3 className={`text-sm font-bold ${tp}`}>Cost Breakdown</h3>
              </div>

              <div className="px-5 sm:px-6 py-5">
                {/* Bar */}
                <div className="flex rounded-full overflow-hidden h-3 w-full mb-3 gap-px">
                  {breakdown.map((seg) =>
                    safe(seg.value) > 0 ? (
                      <div key={seg.label} className={`${seg.color} transition-all duration-500`} style={{ width: `${pct(seg.value)}%` }} title={`${seg.label}: ${pct(seg.value).toFixed(1)}%`} />
                    ) : null
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
                  {breakdown.map((seg) => (
                    <div key={seg.label} className={`flex items-center gap-1.5 text-xs font-medium ${ts}`}>
                      <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
                      {seg.label} {pct(seg.value).toFixed(1)}%
                    </div>
                  ))}
                </div>

                {/* Two columns: table + insight */}
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Table */}
                  <div className="flex-1">
                    {[
                      { label: "Selling Price", val: m.revenue,          isPos: true },
                      { label: "Product Cost",  val: values.productCost, isPos: false },
                      { label: "Shipping Cost", val: values.shippingCost,isPos: false },
                      { label: "Ad Spend",      val: values.adCost,       isPos: false },
                      { label: "Gateway Fee",   val: m.gatewayFeeAmt,     isPos: false },
                    ].map((row) => (
                      <div key={row.label} className={`flex justify-between items-center py-2 border-b text-sm ${dark ? "border-slate-700" : "border-gray-100"}`}>
                        <span className={ts}>{row.label}</span>
                        <span className={`font-semibold ${row.isPos ? tp : "text-[#EF4444]"}`}>
                          {row.isPos ? fc(row.val, currency) : `-${fc(row.val, currency)}`}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 text-sm font-bold">
                      <span className={tp}>Net Profit</span>
                      <span className={isProfit ? "text-[#95BF47]" : "text-[#EF4444]"}>{fc(m.netProfit, currency)}</span>
                    </div>
                  </div>

                  {/* Smart Insight */}
                  <div className={`sm:w-44 rounded-xl p-4 flex flex-col items-center text-center gap-2 ${dark ? "bg-slate-700/50" : "bg-gray-50"}`}>
                    <span className="text-3xl">{isProfit ? "🚀" : "⚠️"}</span>
                    <p className={`text-xs font-bold ${isProfit ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                      {isProfit ? `${marginConfig.badge} Margin!` : "Needs Work"}
                    </p>
                    <p className={`text-[11px] leading-relaxed ${ts}`}>{marginConfig.insight}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Suggested Selling Price Card ── */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
              <div className={`flex items-center gap-2 px-5 sm:px-6 py-4 border-b ${dark ? "border-slate-700" : "border-gray-100"}`}>
                <span>🎯</span>
                <div>
                  <h3 className={`text-sm font-bold ${tp}`}>Suggested Selling Price</h3>
                  <p className={`text-xs ${ts}`}>Find the right price to hit your target margin</p>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Target margin control */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-semibold ${tp}`}>Target Profit Margin</label>
                      <span className="text-[#95BF47] font-bold text-sm">{targetMargin}%</span>
                    </div>
                    <input
                      type="range" min={5} max={80} step={1} value={targetMargin}
                      suppressHydrationWarning
                      onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                      aria-label="Target margin slider"
                      className="w-full"
                      style={{
                        background: `linear-gradient(to right, #95BF47 ${((targetMargin - 5) / 75) * 100}%, #E5E7EB ${((targetMargin - 5) / 75) * 100}%)`,
                        borderRadius: 999, height: 4
                      }}
                    />
                    <div className={`flex justify-between text-xs mt-1 ${ts}`}><span>5%</span><span>80%</span></div>
                  </div>

                  {/* Suggested price result */}
                  <div className={`sm:w-48 rounded-2xl p-5 text-center border-2 ${
                    suggestedPrice !== null
                      ? dark ? "border-[#95BF47]/30 bg-[#95BF47]/10" : "border-[#95BF47]/30 bg-[#F0F7E6]"
                      : dark ? "border-slate-600 bg-slate-700/40" : "border-gray-200 bg-gray-50"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${ts}`}>Suggested Price</p>
                    {suggestedPrice !== null ? (
                      <>
                        <p className="text-3xl font-extrabold text-[#95BF47]">{fc(suggestedPrice, currency)}</p>
                        <p className={`text-[11px] mt-1 ${ts}`}>at {targetMargin}% margin</p>
                      </>
                    ) : (
                      <p className="text-sm text-red-400 font-semibold">Not achievable</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end right col */}
        </div>
      </main>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className={`border-t ${dark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"} py-5 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#95BF47] to-[#5E8E3E] flex items-center justify-center text-white font-bold text-sm shrink-0">
              MS
            </div>
            <div>
              <p className={`text-sm font-semibold ${tp}`}>Mohd Sahil Shaikh</p>
              <a href="mailto:ss613999@gmail.com" id="footer-email" className="text-xs text-[#95BF47] hover:text-[#5E8E3E] transition-colors">
                ss613999@gmail.com
              </a>
            </div>
          </div>

          <a
            href="https://digitalheroesco.com"
            id="built-for-digital-heroes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#95BF47] hover:bg-[#5E8E3E] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px"
          >
            <ShopifyLogo size={16} />
            Built for Digital Heroes
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </footer>

      {/* Toast */}
      <div aria-live="polite" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="bg-[#10B981] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap">
          ✅ Results copied to clipboard!
        </div>
      </div>
    </div>
  );
}
