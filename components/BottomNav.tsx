"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/use-session";

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconSize = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2.5" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const IconVendite = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconBilancio = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconTeam = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ceoItems = [
  { href: "/",         label: "Home",    Icon: IconHome },
  { href: "/taglie",   label: "Size",    Icon: IconSize },
  { href: "/vendite",  label: "Vendite", Icon: IconVendite },
  { href: "/bilancio", label: "Bilancio",Icon: IconBilancio },
  { href: "/team",     label: "Team",    Icon: IconTeam },
];

const venditoreItems = [
  { href: "/venditore",          label: "Home",    Icon: IconHome },
  { href: "/taglie",             label: "Size",    Icon: IconSize },
  { href: "/venditore/vendite",  label: "Vendite", Icon: IconVendite },
  { href: "/venditore/bilancio", label: "Bilancio",Icon: IconBilancio },
];

export default function BottomNav() {
  const pathname = usePathname();
  const session = useSession();

  if (pathname === "/login" || session === undefined || session === null) return null;
  const navItems = session.role === "venditore" ? venditoreItems : ceoItems;

  return (
    <nav
      className="inv-mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 14px calc(10px + env(safe-area-inset-bottom, 0px))",
        pointerEvents: "none",
      }}
    >
      <div
        className="inv-glass-panel"
        style={{
          maxWidth: 430,
          margin: "0 auto",
          width: "100%",
          pointerEvents: "auto",
          borderRadius: 28,
          padding: "8px 6px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            gap: 2,
          }}
        >
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "none",
                  flex: 1,
                  minWidth: 0,
                  padding: "7px 4px",
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  ...(active
                    ? {
                        background:
                          "linear-gradient(145deg, rgba(0,215,240,0.18) 0%, rgba(0,188,212,0.06) 100%)",
                        boxShadow:
                          "inset 0 1px 0 rgba(0,215,240,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(0,215,240,0.12)",
                      }
                    : {}),
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "20%",
                      right: "20%",
                      top: 0,
                      height: "30%",
                      background:
                        "linear-gradient(180deg, rgba(0,215,240,0.25) 0%, transparent 100%)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <span
                  style={{
                    color: active ? "#67E8F9" : "rgba(255,255,255,0.28)",
                    display: "flex",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <Icon />
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: active ? "#67E8F9" : "rgba(255,255,255,0.28)",
                    letterSpacing: "0.02em",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
