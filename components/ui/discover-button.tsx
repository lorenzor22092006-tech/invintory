"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Briefcase,
  DollarSign,
  FileText,
  Users,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { colors, radius } from "@/lib/theme";

const spring = {
  type: "spring" as const,
  damping: 20,
  stiffness: 230,
  mass: 1.2,
};

const bubbleSpring = {
  type: "spring" as const,
  bounce: 0.19,
  duration: 0.4,
};

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/taglie", label: "Size", Icon: Briefcase },
  { href: "/vendite", label: "Vendite", Icon: DollarSign },
  { href: "/bilancio", label: "Bilancio", Icon: FileText },
  { href: "/team", label: "Team", Icon: Users },
];

export function DiscoverNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
      setIsSearchExpanded(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Search expand */}
      <motion.div
        layout
        transition={spring}
        onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
        className="inv-glass"
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: radius.pill,
          cursor: "pointer",
          height: 46,
          overflow: "hidden",
          position: "relative",
          padding: "0 16px",
          flex: isSearchExpanded ? 1 : "0 0 auto",
          maxWidth: isSearchExpanded ? 280 : 46,
          minWidth: 46,
        }}
      >
        <Search size={18} color={colors.textSecondary} strokeWidth={2} />
        <motion.form
          initial={false}
          animate={{
            width: isSearchExpanded ? "auto" : "0px",
            opacity: isSearchExpanded ? 1 : 0,
            filter: isSearchExpanded ? "blur(0px)" : "blur(4px)",
            marginLeft: isSearchExpanded ? 12 : 0,
          }}
          transition={spring}
          onSubmit={handleSearchSubmit}
          style={{ overflow: "hidden", display: "flex", alignItems: "center", flex: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca SKU…"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              color: colors.text,
              fontSize: 14,
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </motion.form>
      </motion.div>

      {/* Tabs con bubble */}
      <motion.div
        layout
        transition={spring}
        className="inv-glass"
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: radius.pill,
          height: 46,
          overflow: "hidden",
          position: "relative",
          flex: isSearchExpanded ? "0 0 auto" : 1,
          maxWidth: isSearchExpanded ? 46 : 560,
          minWidth: isSearchExpanded ? 46 : undefined,
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: isSearchExpanded ? 46 : "auto" }}
          transition={spring}
          style={{
            overflow: "hidden",
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <motion.nav
            initial={false}
            animate={{
              opacity: isSearchExpanded ? 0 : 1,
              filter: isSearchExpanded ? "blur(4px)" : "blur(0px)",
            }}
            transition={{ duration: 0.2 }}
            aria-label="Navigazione principale"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px",
              whiteSpace: "nowrap",
            }}
          >
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => router.push(href)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: radius.pill,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    position: "relative",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? colors.accentBright : colors.textMuted,
                    fontFamily: "inherit",
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="inv-nav-bubble"
                      className="inv-glass"
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        borderRadius: radius.pill,
                      }}
                      transition={bubbleSpring}
                    />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.2 : 1.8}
                    style={{ position: "relative", zIndex: 1, flexShrink: 0 }}
                  />
                  <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
                </button>
              );
            })}
          </motion.nav>

          <motion.div
            initial={false}
            animate={{
              opacity: isSearchExpanded ? 1 : 0,
              filter: isSearchExpanded ? "blur(0px)" : "blur(4px)",
            }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: isSearchExpanded ? "auto" : "none",
            }}
          >
            <button
              type="button"
              onClick={() => setIsSearchExpanded(false)}
              aria-label="Chiudi ricerca"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                padding: 8,
              }}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2} />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DiscoverNav;
