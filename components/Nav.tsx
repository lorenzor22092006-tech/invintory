"use client";

import { useState } from "react";

export default function HomePage() {
  const [search, setSearch] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#061311",
        padding: "0 16px",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "56px", // spazio per status bar iPhone
          paddingBottom: "24px",
        }}
      >
        {/* Logo + Nome */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Icona cubo */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#F8FAFC",
            }}
          >
            INVINTORY
          </span>
        </div>

        {/* Campanella notifiche */}
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "#102A24",
            border: "1px solid #1B3A34",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Pallino verde notifica */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22C55E",
              border: "1.5px solid #061311",
            }}
          />
        </button>
      </div>

      {/* ── SALUTO ── */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "#94A3B8", fontSize: "15px", marginBottom: "4px" }}>
          Ciao Marco 👋
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2 }}>
          Gestisci il tuo{" "}
          <span style={{ color: "#22C55E" }}>stock</span>
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginTop: "6px" }}>
          Tutto sotto controllo, in tempo reale.
        </p>
      </div>

      {/* ── SEARCH ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#102A24",
          border: "1px solid #1B3A34",
          borderRadius: "14px",
          padding: "12px 16px",
          marginBottom: "24px",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Cerca per SKU, nome o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#F8FAFC",
            fontSize: "14px",
            width: "100%",
          }}
        />
      </div>

      {/* ── CARDS KPI ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {/* Card Prodotti */}
        <KpiCard
          label="PRODOTTI"
          value="1.248"
          sub="↑ +12 oggi"
          subColor="#22C55E"
          accent="#10B981"
        />

        {/* Card Vendite oggi */}
        <KpiCard
          label="VENDITE OGGI"
          value="€3.4k"
          sub="↑ +8.2%"
          subColor="#22C55E"
          accent="#059669"
        />
      </div>

      <div style={{ marginBottom: "32px" }}>
        {/* Card In scadenza — larghezza piena */}
        <KpiCard
          label="IN SCADENZA"
          value="7"
          sub="⚠ urgenti"
          subColor="#F87171"
          accent="#DC2626"
          wide
        />
      </div>

      {/* ── SEZIONE ATTIVITÀ RECENTE ── */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F8FAFC" }}>
            Attività recente
          </h2>
          <span style={{ fontSize: "13px", color: "#22C55E", cursor: "pointer" }}>
            Vedi tutto →
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <ActivityRow
            name="Nike Air Force 1"
            sku="SKU-1042"
            action="Venduto"
            price="€120"
            time="2 min fa"
            color="#22C55E"
          />
          <ActivityRow
            name="Jordan 1 Retro High"
            sku="SKU-0998"
            action="Aggiunto"
            price="€210"
            time="1 ora fa"
            color="#10B981"
          />
          <ActivityRow
            name="Yeezy 350 V2"
            sku="SKU-0751"
            action="In scadenza"
            price="€340"
            time="domani"
            color="#F87171"
          />
        </div>
      </div>
    </div>
  );
}

// ── Componente KPI Card ──
function KpiCard({
  label,
  value,
  sub,
  subColor,
  accent,
  wide,
}: {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  accent: string;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        background: "#0B1F1A",
        border: "1px solid #1B3A34",
        borderRadius: "16px",
        padding: "16px",
        gridColumn: wide ? "span 2" : undefined,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Sfumatura accent angolo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: accent,
          opacity: 0.08,
          transform: "translate(20px, -20px)",
        }}
      />
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "#64748B",
          marginBottom: "8px",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "26px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px" }}>
        {value}
      </p>
      <p style={{ fontSize: "12px", color: subColor, fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

// ── Componente Riga Attività ──
function ActivityRow({
  name,
  sku,
  action,
  price,
  time,
  color,
}: {
  name: string;
  sku: string;
  action: string;
  price: string;
  time: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0B1F1A",
        border: "1px solid #1B3A34",
        borderRadius: "14px",
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Punto colorato */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#F8FAFC" }}>{name}</p>
          <p style={{ fontSize: "11px", color: "#64748B" }}>{sku}</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color }}>
          {action}
        </p>
        <p style={{ fontSize: "11px", color: "#64748B" }}>
          {price} · {time}
        </p>
      </div>
    </div>
  );
}