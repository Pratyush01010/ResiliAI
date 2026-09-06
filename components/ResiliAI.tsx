"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Shield, MapPin, Bell, User, Globe, Menu, X, ChevronRight, Droplets,
  Wind, Thermometer, Activity, TrendingUp, AlertTriangle, CheckCircle2,
  Upload, Send, Bot, Home, Map as MapIcon, Users, Radio, MessageSquare,
  Siren, Building2, Truck, Stethoscope, TrafficCone, Play, Pause, RotateCcw,
  ChevronDown, Circle, Dot, Sparkles, Zap
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

/* ---------------------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------------------- */
const RISK = {
  low: { label: "Low", color: "#3FC98A", bg: "rgba(63,201,138,0.12)", ring: "rgba(63,201,138,0.35)" },
  moderate: { label: "Moderate", color: "#E7B94C", bg: "rgba(231,185,76,0.12)", ring: "rgba(231,185,76,0.35)" },
  high: { label: "High", color: "#E38A46", bg: "rgba(227,138,70,0.12)", ring: "rgba(227,138,70,0.35)" },
  critical: { label: "Critical", color: "#E4574F", bg: "rgba(228,87,79,0.14)", ring: "rgba(228,87,79,0.4)" },
};
const riskFromScore = (s) => (s < 35 ? "low" : s < 60 ? "moderate" : s < 80 ? "high" : "critical");

const ZONES = [
  { id: "wakad", name: "Wakad", cx: 190, cy: 150, baseRisk: 68, vulnerability: 82, rainfall: 110, reports: 14, shelter: "1.2 km", hospital: "2.4 km" },
  { id: "baner", name: "Baner", cx: 310, cy: 120, baseRisk: 42, vulnerability: 58, rainfall: 74, reports: 6, shelter: "0.8 km", hospital: "1.6 km" },
  { id: "aundh", name: "Aundh", cx: 260, cy: 210, baseRisk: 30, vulnerability: 44, rainfall: 55, reports: 3, shelter: "1.5 km", hospital: "2.0 km" },
  { id: "katraj", name: "Katraj", cx: 380, cy: 300, baseRisk: 58, vulnerability: 71, rainfall: 88, reports: 9, shelter: "2.1 km", hospital: "3.0 km" },
  { id: "hadapsar", name: "Hadapsar", cx: 470, cy: 220, baseRisk: 47, vulnerability: 55, rainfall: 66, reports: 5, shelter: "1.0 km", hospital: "1.8 km" },
];

const DEMO_STEPS = [
  { label: "Normal", risk: 24, rainfall: 18, reports: 6 },
  { label: "Heavy rain", risk: 52, rainfall: 61, reports: 11 },
  { label: "Waterlogging reports", risk: 73, rainfall: 88, reports: 19 },
  { label: "Critical", risk: 87, rainfall: 118, reports: 27 },
];

const TREND_DATA = [
  { t: "6 AM", risk: 22 }, { t: "8 AM", risk: 34 }, { t: "10 AM", risk: 51 },
  { t: "12 PM", risk: 68 }, { t: "2 PM", risk: 87 },
];

const FEED_ITEMS = [
  { id: 1, icon: "🌊", type: "Waterlogging", area: "Wakad", time: "4 min ago", status: "Reported" },
  { id: 2, icon: "🚧", type: "Road blocked", area: "Baner", time: "9 min ago", status: "Verified" },
  { id: 3, icon: "🌳", type: "Fallen tree", area: "Aundh", time: "15 min ago", status: "Resolved" },
  { id: 4, icon: "🏚️", type: "Flooding", area: "Katraj", time: "22 min ago", status: "Verified" },
];

const ACTIONS = [
  "Move to higher ground if flooding occurs.",
  "Avoid walking or driving through moving water.",
  "Follow official evacuation instructions.",
  "Keep essential documents and medicines accessible.",
  "Contact emergency services if trapped or in immediate danger.",
];

function cx(...c) { return c.filter(Boolean).join(" "); }

/* ---------------------------------------------------------------------
   PRIMITIVES
--------------------------------------------------------------------- */
function GlassPanel({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function RiskBadge({ level, size = "md" }) {
  const r = RISK[level];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      )}
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
      {r.label}
    </span>
  );
}

function CountUp({ value, duration = 1.1, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

function RiskGauge({ value, size = 168, level }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = RISK[level].color;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums text-white/95" style={{ fontFamily: "Manrope, sans-serif" }}>
          <CountUp value={pct} decimals={0} suffix="%" />
        </span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-white/40 mt-1">Flood risk</span>
      </div>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      LIVE
    </span>
  );
}

/* ---------------------------------------------------------------------
   INTRO
--------------------------------------------------------------------- */
function Intro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060810] overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      <div className="absolute inset-0 opacity-[0.35]" style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }} />
      {[...Array(14)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-sky-300/50"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
          animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -14, 0] }}
          transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Shield className="w-7 h-7 text-sky-300/90" strokeWidth={1.6} />
          <span className="text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
            ResiliAI
          </span>
        </div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[13px] tracking-[0.2em] text-white/45 uppercase"
        >
          AI for safer, stronger communities
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95, duration: 0.6 }}
          className="mt-3 text-sm text-sky-200/70"
        >
          Predict. Prepare. Protect.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------
   NAVBAR
--------------------------------------------------------------------- */
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "map", label: "Risk map", icon: MapIcon },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "community", label: "Community", icon: Users },
  { id: "command", label: "Command center", icon: Radio },
  { id: "assistant", label: "Assistant", icon: Bot },
];

function Navbar({ active, setActive, demoMode, setDemoMode, alertCount }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080B12]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <Shield className="w-5 h-5 text-sky-300/90" strokeWidth={1.7} />
            <span className="text-[17px] font-semibold tracking-tight text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              ResiliAI
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1 relative">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                className={cx(
                  "relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors",
                  active === n.id ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                {n.label}
                {active === n.id && (
                  <motion.span layoutId="nav-indicator" className="absolute inset-0 rounded-lg bg-white/[0.06] -z-10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setDemoMode((d) => !d)}
              className={cx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                demoMode ? "border-amber-400/40 text-amber-300 bg-amber-400/10" : "border-white/10 text-white/50 hover:text-white/80"
              )}
            >
              <span className={cx("w-1.5 h-1.5 rounded-full", demoMode ? "bg-amber-400" : "bg-emerald-400")} />
              {demoMode ? "DEMO" : "LIVE"}
            </button>
            <button className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-[13px] px-2 py-1">
              <MapPin className="w-3.5 h-3.5" /> Pune
            </button>
            <button className="text-white/50 hover:text-white/80 text-[13px] px-2 py-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> EN
            </button>
            <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/5">
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </button>
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400/30 to-indigo-500/30 border border-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white/80" />
            </button>
          </div>

          <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-[#0B0E16] border-l border-white/10 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-white font-semibold">Menu</span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
              </div>
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setActive(n.id); setMobileOpen(false); }}
                    className={cx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                      active === n.id ? "bg-white/[0.07] text-white" : "text-white/55"
                    )}
                  >
                    <n.icon className="w-4 h-4" /> {n.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#080B12]/90 backdrop-blur-xl px-2 py-1.5 flex justify-around">
        {NAV_ITEMS.slice(0, 5).map((n) => (
          <button key={n.id} onClick={() => setActive(n.id)} className="flex flex-col items-center gap-1 px-2 py-1.5 min-w-[56px]">
            <n.icon className={cx("w-[18px] h-[18px]", active === n.id ? "text-sky-300" : "text-white/40")} />
            <span className={cx("text-[10px]", active === n.id ? "text-sky-300" : "text-white/40")}>{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------
   STAT CARD
--------------------------------------------------------------------- */
function StatCard({ icon: Icon, label, value, suffix = "", delay, tone = "sky" }) {
  const toneMap = {
    sky: "from-sky-400/15 to-sky-500/5 text-sky-300",
    red: "from-red-400/15 to-red-500/5 text-red-300",
    amber: "from-amber-400/15 to-amber-500/5 text-amber-300",
    emerald: "from-emerald-400/15 to-emerald-500/5 text-emerald-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <GlassPanel className="p-4 h-full transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className={cx("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 transition-transform group-hover:scale-110", toneMap[tone])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-2xl font-semibold text-white tabular-nums" style={{ fontFamily: "Manrope, sans-serif" }}>
          <CountUp value={value} />{suffix}
        </div>
        <div className="text-[12px] text-white/45 mt-0.5">{label}</div>
      </GlassPanel>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------
   OVERVIEW PAGE
--------------------------------------------------------------------- */
function Overview({ globalRisk, weather, onNavigate, onSelectZone }) {
  const level = riskFromScore(globalRisk);
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-white tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
          Good morning. Here's your community risk overview.
        </h1>
        <div className="flex items-center gap-2 mt-1.5 text-[13px] text-white/45">
          <span>Pune region</span><span className="text-white/20">•</span><LiveDot /><span>Updated 34 seconds ago</span>
        </div>
      </motion.div>

      {level === "critical" || level === "high" ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 border"
          style={{ background: RISK[level].bg, borderColor: RISK[level].ring }}
        >
          <div className="flex items-center gap-3">
            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <AlertTriangle className="w-4 h-4" style={{ color: RISK[level].color }} />
            </motion.span>
            <p className="text-[13px] text-white/80">
              <span className="font-medium" style={{ color: RISK[level].color }}>Critical flood risk in Wakad.</span>{" "}
              Estimated risk has risen to {Math.round(globalRisk)}% due to heavy rainfall.
            </p>
          </div>
          <button onClick={() => onNavigate("alerts")} className="shrink-0 text-[12px] text-white/70 hover:text-white flex items-center gap-1">
            View <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassPanel className="lg:col-span-1 p-6 flex flex-col items-center justify-center gap-4">
          <div className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-white/40">
            <span>Current regional risk</span>
            <RiskBadge level={level} size="sm" />
          </div>
          <RiskGauge value={globalRisk} level={level} />
          <div className="grid grid-cols-2 gap-3 w-full text-[13px]">
            <div className="flex items-center gap-2 text-white/55"><Droplets className="w-3.5 h-3.5 text-sky-300/70" /> Rainfall <span className="ml-auto text-white/85">{weather.rainfall} mm</span></div>
            <div className="flex items-center gap-2 text-white/55"><Wind className="w-3.5 h-3.5 text-sky-300/70" /> Humidity <span className="ml-auto text-white/85">{weather.humidity}%</span></div>
            <div className="flex items-center gap-2 text-white/55"><Activity className="w-3.5 h-3.5 text-sky-300/70" /> Incidents <span className="ml-auto text-white/85">{weather.incidents}</span></div>
            <div className="flex items-center gap-2 text-white/55"><TrendingUp className="w-3.5 h-3.5 text-red-300/70" /> Trend <span className="ml-auto text-red-300">↑ 14%</span></div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-white/70">Risk trend</span>
            <span className="text-[11px] text-white/35">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TREND_DATA}>
              <defs>
                <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E38A46" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E38A46" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: "#0E1320", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
              <Area type="monotone" dataKey="risk" stroke="#E38A46" strokeWidth={2} fill="url(#riskFill)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Siren} label="Critical zones" value={4} delay={0.05} tone="red" />
        <StatCard icon={AlertTriangle} label="High risk zones" value={8} delay={0.12} tone="amber" />
        <StatCard icon={MessageSquare} label="Active reports" value={27} delay={0.19} tone="sky" />
        <StatCard icon={Building2} label="Emergency shelters" value={12} delay={0.26} tone="emerald" />
      </div>

      <GlassPanel className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-white/70">Hyperlocal snapshot</span>
          <button onClick={() => onNavigate("map")} className="text-[12px] text-sky-300/80 hover:text-sky-200 flex items-center gap-1">
            Open full map <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {ZONES.map((z, i) => {
            const lvl = riskFromScore(z.baseRisk);
            return (
              <motion.button
                key={z.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                onClick={() => { onSelectZone(z.id); onNavigate("map"); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] text-white/80 hover:bg-white/[0.05] transition-colors"
                style={{ borderColor: RISK[lvl].ring, background: RISK[lvl].bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK[lvl].color }} />
                {z.name} <span className="text-white/40">{z.baseRisk}%</span>
              </motion.button>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ---------------------------------------------------------------------
   RISK MAP PAGE
--------------------------------------------------------------------- */
function RiskMapPage({ zones, selected, setSelected }) {
  const [layer, setLayer] = useState("flood");
  const active = zones.find((z) => z.id === selected) || null;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Hyperlocal disaster risk map</h2>
          <p className="text-[13px] text-white/40 mt-0.5">Click a zone to see detailed risk data.</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[["flood", "Flood risk"], ["rainfall", "Rainfall"], ["vulnerability", "Vulnerability"], ["reports", "Community reports"]].map(([id, label]) => (
            <button key={id} onClick={() => setLayer(id)}
              className={cx("px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                layer === id ? "bg-sky-400/15 border-sky-400/40 text-sky-200" : "border-white/10 text-white/45 hover:text-white/75")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassPanel className="lg:col-span-2 p-4 relative overflow-hidden">
          <svg viewBox="0 0 560 380" className="w-full h-[420px]">
            <defs>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="560" height="380" fill="url(#grid)" />
            {zones.map((z) => {
              const lvl = riskFromScore(z.baseRisk);
              const isActive = selected === z.id;
              const radius = layer === "reports" ? 16 + z.reports / 2 : 24 + z.baseRisk / 4;
              return (
                <g key={z.id} className="cursor-pointer" onClick={() => setSelected(z.id)}>
                  <motion.circle
                    cx={z.cx} cy={z.cy} r={radius}
                    fill={RISK[lvl].color} opacity={0.16}
                    animate={isActive ? { r: [radius, radius + 6, radius] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <motion.circle
                    cx={z.cx} cy={z.cy} r={9} fill={RISK[lvl].color}
                    stroke={isActive ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth={isActive ? 2 : 1}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  />
                  <text x={z.cx} y={z.cy - 18} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="12" fontWeight={isActive ? 600 : 400}>
                    {z.name}
                  </text>
                  <text x={z.cx} y={z.cy + 3} textAnchor="middle" fill="#04101a" fontSize="8" fontWeight={700} style={{ pointerEvents: "none" }}>
                    {z.baseRisk}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-4 left-4 flex gap-3 text-[11px] text-white/50">
            {Object.entries(RISK).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: v.color }} />{v.label}</span>
            ))}
          </div>
        </GlassPanel>

        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 24, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassPanel className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{active.name}</h3>
                      <RiskBadge level={riskFromScore(active.baseRisk)} size="sm" />
                    </div>
                    <RiskGauge value={active.baseRisk} level={riskFromScore(active.baseRisk)} size={72} />
                  </div>
                  <div className="space-y-3 text-[13px]">
                    {[
                      ["Vulnerability", `${active.vulnerability}%`],
                      ["Rainfall", `${active.rainfall} mm`],
                      ["Active reports", active.reports],
                      ["Nearest shelter", active.shelter],
                      ["Nearest hospital", active.hospital],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-white/45">{k}</span>
                        <span className="text-white/85 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {[["Vulnerability", active.vulnerability], ["Rainfall load", Math.min(100, active.rainfall)]].map(([label, val]) => (
                      <div key={label}>
                        <div className="flex justify-between text-[11px] text-white/40 mb-1"><span>{label}</span><span>{val}%</span></div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div className="h-full rounded-full bg-sky-400/70" initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.9 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 w-full text-center text-[13px] text-sky-300 hover:text-sky-200 flex items-center justify-center gap-1 py-2 rounded-lg border border-sky-400/20 hover:bg-sky-400/5">
                    View full analysis <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </GlassPanel>
              </motion.div>
            ) : (
              <GlassPanel className="p-8 text-center text-white/35 text-sm">
                Select a zone on the map to view details.
              </GlassPanel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   ALERTS PAGE
--------------------------------------------------------------------- */
function AlertsPage({ zones, onNavigate }) {
  const critical = zones.filter((z) => riskFromScore(z.baseRisk) === "critical" || riskFromScore(z.baseRisk) === "high");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Live alerts</h2>
      {critical.length === 0 ? (
        <GlassPanel className="p-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-300/70 mx-auto mb-3" />
          <p className="text-white/80 font-medium">You're all clear</p>
          <p className="text-white/40 text-sm mt-1">No critical alerts in your selected region.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {critical.map((z, i) => {
            const lvl = riskFromScore(z.baseRisk);
            return (
              <motion.div key={z.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassPanel className="p-4 border-l-2" style={{ borderLeftColor: RISK[lvl].color }}>
                  <div className="flex items-start gap-3">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: RISK[lvl].bg }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: RISK[lvl].color }} />
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-white uppercase tracking-wide" style={{ color: RISK[lvl].color }}>
                          {lvl} flood risk
                        </span>
                        <span className="text-white/40 text-[13px]">· {z.name}</span>
                      </div>
                      <p className="text-white/60 text-[13px] mt-1">
                        Estimated flood risk has increased to {z.baseRisk}% due to heavy rainfall and local conditions.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => onNavigate("map")} className="text-[12px] px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5">View area</button>
                        <button className="text-[12px] px-3 py-1.5 rounded-lg text-white/90" style={{ background: RISK[lvl].bg, border: `1px solid ${RISK[lvl].ring}` }}>Safety actions</button>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}

      <GlassPanel className="p-5">
        <h3 className="text-[13px] font-medium text-white/70 mb-4">What should you do?</h3>
        <div className="space-y-2.5">
          {ACTIONS.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="w-5 h-5 rounded-full bg-sky-400/15 text-sky-300 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-[13px] text-white/70">{a}</span>
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ---------------------------------------------------------------------
   COMMUNITY PAGE
--------------------------------------------------------------------- */
function ReportModal({ open, onClose }) {
  const [step, setStep] = useState("form");
  const [type, setType] = useState("Flood");
  useEffect(() => { if (open) setStep("form"); }, [open]);
  const types = ["Flood", "Waterlogging", "Road block", "Fallen tree", "Landslide", "Fire", "Medical emergency", "Other"];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md" onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel className="p-6 bg-[#0C0F18]/95">
              {step === "form" ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-white">Report an incident</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-white/50" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] text-white/45 mb-1.5 block">Incident type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {types.map((t) => (
                          <button key={t} onClick={() => setType(t)}
                            className={cx("px-2.5 py-1 rounded-lg text-[12px] border", type === t ? "bg-sky-400/15 border-sky-400/40 text-sky-200" : "border-white/10 text-white/50")}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] text-white/45 mb-1.5 block">Location</label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-[13px] text-white/60">
                        <MapPin className="w-3.5 h-3.5 text-sky-300/70" /> Using current location
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] text-white/45 mb-1.5 block">Description</label>
                      <textarea rows={3} placeholder="Describe what you're seeing…" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-[13px] text-white/80 placeholder-white/25 focus:outline-none focus:border-sky-400/40" />
                    </div>
                    <div className="border-2 border-dashed border-white/10 rounded-lg py-6 flex flex-col items-center gap-1.5 text-white/35 hover:border-sky-400/30 hover:text-white/55 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span className="text-[12px]">Drop a photo or click to upload</span>
                    </div>
                    <button onClick={() => setStep("done")} className="w-full py-2.5 rounded-lg bg-sky-400/90 hover:bg-sky-400 text-[#04101a] font-semibold text-[13px] transition-colors">
                      Submit report
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-14 h-14 rounded-full bg-emerald-400/15 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                  </motion.div>
                  <p className="text-white font-semibold">Report received</p>
                  <p className="text-white/45 text-[13px] mt-1">Thank you for helping your community.</p>
                  <button onClick={onClose} className="mt-5 text-[13px] text-sky-300 hover:text-sky-200">Close</button>
                </motion.div>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommunityPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Community intelligence</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-400/90 hover:bg-red-400 text-[#1a0404] text-[13px] font-semibold transition-colors">
          <Siren className="w-4 h-4" /> Report incident
        </button>
      </div>
      <div className="grid gap-3">
        {FEED_ITEMS.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassPanel className="p-4 flex items-center gap-4">
              <span className="text-xl">{f.icon}</span>
              <div className="flex-1">
                <p className="text-[13px] text-white/85 font-medium">{f.type}</p>
                <p className="text-[12px] text-white/40 flex items-center gap-1"><MapPin className="w-3 h-3" /> {f.area} · {f.time}</p>
              </div>
              <span className={cx("text-[11px] px-2 py-1 rounded-full border",
                f.status === "Resolved" ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" :
                f.status === "Verified" ? "text-sky-300 border-sky-400/30 bg-sky-400/10" :
                "text-amber-300 border-amber-400/30 bg-amber-400/10")}>
                {f.status}
              </span>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   COMMAND CENTER PAGE
--------------------------------------------------------------------- */
function CommandCenterPage({ zones }) {
  const ranked = [...zones].sort((a, b) => b.baseRisk - a.baseRisk);
  const allocations = [
    { icon: Stethoscope, action: "Medical team", target: ranked[0]?.name },
    { icon: Truck, action: "Rescue team", target: ranked[1]?.name },
    { icon: Building2, action: "Shelter activation", target: ranked[2]?.name },
    { icon: TrafficCone, action: "Traffic control", target: ranked[3]?.name },
  ];
  const stats = [
    { label: "Critical areas", value: zones.filter((z) => riskFromScore(z.baseRisk) === "critical").length },
    { label: "Active incidents", value: zones.reduce((s, z) => s + z.reports, 0) },
    { label: "Response teams", value: 9 },
    { label: "Shelters", value: 12 },
    { label: "Hospitals", value: 6 },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Emergency command center</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassPanel className="p-4 text-center">
              <div className="text-2xl font-semibold text-white tabular-nums"><CountUp value={s.value} /></div>
              <div className="text-[11px] text-white/40 mt-1">{s.label}</div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassPanel className="p-5">
          <h3 className="text-[13px] font-medium text-white/70 mb-4">Priority areas</h3>
          <div className="space-y-2.5">
            {ranked.map((z, i) => {
              const lvl = riskFromScore(z.baseRisk);
              return (
                <motion.div key={z.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] text-white/60 text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
                  <span className="flex-1 text-[13px] text-white/85">{z.name}</span>
                  <span className="text-[13px] font-semibold" style={{ color: RISK[lvl].color }}>{z.baseRisk}</span>
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h3 className="text-[13px] font-medium text-white/70 mb-4">Recommended resource allocation</h3>
          <div className="space-y-2.5">
            {allocations.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center"><a.icon className="w-4 h-4 text-sky-300" /></div>
                <span className="flex-1 text-[13px] text-white/70">{a.action}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/25" />
                <span className="text-[13px] font-medium text-white/90">{a.target}</span>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   AI ASSISTANT PAGE
--------------------------------------------------------------------- */
const CANNED = {
  flood: "Move away from moving water and seek higher ground if necessary. Avoid driving or walking through floodwater. Follow official evacuation instructions.",
  heatwave: "Stay indoors during peak heat hours, drink water regularly, and check on elderly neighbors. Avoid strenuous outdoor activity between noon and 4 PM.",
  landslide: "Move away from steep slopes and unstable ground immediately. Watch for cracking sounds or shifting soil, and report the area to local authorities.",
  fire: "Evacuate the area immediately and stay low to avoid smoke inhalation. Call emergency services and avoid using elevators.",
  "medical emergency": "Call emergency services right away. Keep the person still, monitor breathing, and follow dispatcher instructions until help arrives.",
};

function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi, I'm your ResiliAI assistant. Ask me anything about staying safe, or choose a quick action below." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState("English");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const respond = useCallback((text) => {
    const key = text.toLowerCase();
    const found = Object.keys(CANNED).find((k) => key.includes(k));
    const reply = found ? CANNED[found] : "Stay alert and follow official guidance from local authorities. If this is a life-threatening emergency, contact emergency services immediately.";
    setMessages((m) => [...m, { role: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    }, 900);
  }, []);

  const quick = ["Flood", "Heatwave", "Landslide", "Fire", "Medical emergency"];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>ResiliAI assistant</h2>
        <p className="text-[13px] text-white/40 mt-1">Get clear, location-aware emergency guidance.</p>
        <div className="flex justify-center gap-1.5 mt-3">
          {["English", "Hindi", "Marathi"].map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cx("px-2.5 py-1 rounded-full text-[11px] border", lang === l ? "bg-sky-400/15 border-sky-400/40 text-sky-200" : "border-white/10 text-white/40")}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <GlassPanel className="p-4 h-[420px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px]",
                m.role === "user" ? "bg-sky-400/90 text-[#04101a] rounded-br-sm" : "bg-white/[0.05] text-white/85 rounded-bl-sm border border-white/[0.06]")}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
          {quick.map((q) => (
            <button key={q} onClick={() => respond(q)} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-white/50 hover:text-white/85 hover:border-sky-400/30">
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { respond(input.trim()); setInput(""); } }}
            placeholder="Ask a safety question…"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[13px] text-white/85 placeholder-white/25 focus:outline-none focus:border-sky-400/40"
          />
          <button onClick={() => { if (input.trim()) { respond(input.trim()); setInput(""); } }} className="w-10 h-10 rounded-xl bg-sky-400/90 hover:bg-sky-400 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-[#04101a]" />
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

/* ---------------------------------------------------------------------
   ROOT APP
--------------------------------------------------------------------- */
export default function ResiliAI() {
  const [booted, setBooted] = useState(false);
  const [active, setActive] = useState("overview");
  const [selectedZone, setSelectedZone] = useState("wakad");
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  const [zones, setZones] = useState(ZONES);
  const [weather, setWeather] = useState({ rainfall: 72, humidity: 84, incidents: 17 });

  const globalRisk = demoMode ? DEMO_STEPS[demoStep].risk : Math.max(...zones.map((z) => z.baseRisk));

  useEffect(() => {
    if (!demoMode) { setZones(ZONES); setWeather({ rainfall: 72, humidity: 84, incidents: 17 }); return; }
    const step = DEMO_STEPS[demoStep];
    setWeather({ rainfall: step.rainfall, humidity: 70 + demoStep * 5, incidents: 8 + demoStep * 5 });
    setZones(ZONES.map((z, i) => ({
      ...z,
      baseRisk: Math.min(97, Math.round(z.baseRisk * (0.5 + demoStep * 0.22) + (i === 0 ? 8 : 0))),
      reports: step.reports - i,
    })));
  }, [demoMode, demoStep]);

  useEffect(() => {
    if (!demoRunning) return;
    if (demoStep >= DEMO_STEPS.length - 1) { setDemoRunning(false); return; }
    const t = setTimeout(() => setDemoStep((s) => s + 1), 2200);
    return () => clearTimeout(t);
  }, [demoRunning, demoStep]);

  const runSimulation = () => { setDemoMode(true); setDemoStep(0); setDemoRunning(true); setActive("overview"); };
  const resetSimulation = () => { setDemoRunning(false); setDemoStep(0); };

  const alertCount = zones.filter((z) => riskFromScore(z.baseRisk) === "critical" || riskFromScore(z.baseRisk) === "high").length;

  return (
    <div className="min-h-screen w-full bg-[#080B12] text-white font-sans antialiased relative" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.25]" style={{
        backgroundImage: "radial-gradient(circle at 20% 10%, rgba(56,132,255,0.06), transparent 40%), radial-gradient(circle at 80% 90%, rgba(228,87,79,0.05), transparent 40%)",
      }} />

      <AnimatePresence>{!booted && <Intro onDone={() => setBooted(true)} />}</AnimatePresence>

      {booted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Navbar active={active} setActive={setActive} demoMode={demoMode} setDemoMode={setDemoMode} alertCount={alertCount} />

          <div className="max-w-7xl mx-auto px-5 py-6 pb-24 lg:pb-10 relative z-10">
            {demoMode && (
              <div className="mb-5 flex items-center justify-between flex-wrap gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] text-amber-200/90">
                  <Sparkles className="w-4 h-4" /> Demo mode — simulating: <span className="font-semibold">{DEMO_STEPS[demoStep].label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => (demoRunning ? setDemoRunning(false) : runSimulation())} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 text-amber-200 text-[12px] hover:bg-amber-400/25">
                    {demoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {demoRunning ? "Pause" : "Simulate flood event"}
                  </button>
                  <button onClick={resetSimulation} className="p-1.5 rounded-lg text-amber-200/70 hover:bg-amber-400/10"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                {active === "overview" && <Overview globalRisk={globalRisk} weather={weather} onNavigate={setActive} onSelectZone={setSelectedZone} />}
                {active === "map" && <RiskMapPage zones={zones} selected={selectedZone} setSelected={setSelectedZone} />}
                {active === "alerts" && <AlertsPage zones={zones} onNavigate={setActive} />}
                {active === "community" && <CommunityPage />}
                {active === "command" && <CommandCenterPage zones={zones} />}
                {active === "assistant" && <AiAssistant />}
              </motion.div>
            </AnimatePresence>
          </div>

          <button className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-red-400/95 text-[#1a0404] text-[13px] font-semibold shadow-lg shadow-red-500/20"
            onClick={() => setActive("community")}>
            <Siren className="w-4 h-4" /> Report
          </button>
        </motion.div>
      )}
    </div>
  );
}
