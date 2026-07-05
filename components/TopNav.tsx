"use client";

import { useRouter, usePathname } from "next/navigation";
import { DiscoverNav } from "@/components/ui/discover-button";
import { colors, layout, radius } from "@/lib/theme";
import { useSession, logout } from "@/lib/use-session";

const showDemoBadge = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  if (pathname === "/login") return null;
  const isVenditore = session?.role === "venditore";
  const homeHref = isVenditore ? "/venditore" : "/";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(5, 8, 16, 0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: `0 ${layout.pagePadX}`,
          height: layout.navHeight,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Desktop: logo */}
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="inv-desktop-only"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <img
            src="/invintory-logo.png"
            alt=""
            width={36}
            height={36}
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 18,
              fontWeight: 800,
              color: colors.text,
              letterSpacing: "0.06em",
            }}
          >
            Invintory
          </span>
        </button>

        {/* Mobile: saluto stile design (avatar liquid + Bentornato) */}
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="inv-mobile-only"
          style={{
            alignItems: "center",
            gap: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: colors.onAccent,
              background:
                "linear-gradient(172deg, rgba(165,245,255,0.52) 0%, rgba(0,215,240,0.78) 18%, rgba(0,185,215,0.94) 50%, rgba(0,102,140,1) 100%)",
              boxShadow:
                "inset 0 2px 5px rgba(255,255,255,0.44), inset 0 -3px 6px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(0,38,58,0.9), 0 0 0 3.5px rgba(0,185,215,0.22), 0 4px 14px rgba(0,0,0,0.6)",
            }}
          >
            {isVenditore && session?.nome ? session.nome.charAt(0).toUpperCase() : "RS"}
          </span>
          <span style={{ textAlign: "left", minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Bentornato
            </span>
            <span
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                color: colors.text,
                lineHeight: 1.2,
              }}
            >
              {isVenditore && session?.nome ? session.nome : "Rubinos Sellers"}
            </span>
          </span>
        </button>

        <div className="inv-desktop-only" style={{ flex: 1, minWidth: 0 }}>
          <DiscoverNav role={session?.role} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {showDemoBadge && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.accentBright,
                background: colors.accentSoft,
                border: `1px solid ${colors.borderStrong}`,
                borderRadius: radius.pill,
                padding: "6px 12px",
                whiteSpace: "nowrap",
              }}
            >
              Demo data
            </span>
          )}
          {/* Logout (mobile + desktop) */}
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Esci"
            className="inv-btn-glass"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
              padding: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          {/* Mobile: ghost circles (impostazioni, solo CEO) */}
          {!isVenditore && (
          <button
            type="button"
            onClick={() => router.push("/config")}
            aria-label="Impostazioni"
            className="inv-mobile-only inv-btn-glass"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
              padding: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          )}

          {/* Desktop: avatar liquid */}
          <div
            className="inv-desktop-only"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background:
                "linear-gradient(172deg, rgba(165,245,255,0.52) 0%, rgba(0,215,240,0.78) 18%, rgba(0,185,215,0.94) 50%, rgba(0,102,140,1) 100%)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: colors.onAccent,
              boxShadow:
                "inset 0 2px 5px rgba(255,255,255,0.44), inset 0 -3px 6px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(0,38,58,0.9), 0 0 0 3.5px rgba(0,185,215,0.22), 0 4px 14px rgba(0,0,0,0.6)",
            }}
          >
            RS
          </div>
        </div>
      </div>
    </header>
  );
}
