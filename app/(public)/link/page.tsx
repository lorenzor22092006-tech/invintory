"use client";

import { useCallback, useRef, useState } from "react";

type Outfit = {
  id: string;
  name: string;
  image: string;
};

const OUTFITS: Outfit[] = [
  { id: "blue-ice", name: "BLUE ICE", image: "/outfits/blue-ice.png" },
  { id: "black-ops", name: "BLACK OPS", image: "/outfits/black-ops.png" },
  { id: "ferrari", name: "FERRARI", image: "/outfits/ferrari.png" },
  { id: "london", name: "LONDON", image: "/outfits/london.png" },
  { id: "tokyo", name: "TOKYO", image: "/outfits/tokyo.png" },
];

// durata di ogni "gamba" della transizione (uscita / entrata)
const LEG = 170;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type AnimPhase = "idle" | "out" | "in-start" | "in";

export default function LinkPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <main
      style={{
        height: "100dvh",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        padding:
          "max(20px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom))",
        overflow: "hidden",
      }}
    >
      {selectedId ? (
        <SelectedState
          outfit={OUTFITS.find((o) => o.id === selectedId)!}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <Selector onChoose={(o) => setSelectedId(o.id)} />
      )}
    </main>
  );
}

function Selector({ onChoose }: { onChoose: (o: Outfit) => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [dir, setDir] = useState<1 | -1>(1);
  const busy = useRef(false);

  const outfit = OUTFITS[index];

  const change = useCallback(
    (d: 1 | -1) => {
      if (busy.current) return;
      busy.current = true;
      setDir(d);
      setPhase("out");

      window.setTimeout(() => {
        setIndex((i) => (i + d + OUTFITS.length) % OUTFITS.length);
        setPhase("in-start");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            setPhase("in");
            window.setTimeout(() => {
              setPhase("idle");
              busy.current = false;
            }, LEG);
          })
        );
      }, LEG);
    },
    []
  );

  // stile immagine in base alla fase (l'uscita va nel verso del movimento,
  // l'entrata arriva dal lato opposto)
  const OFFSET = 44;
  let avatarStyle: React.CSSProperties;
  if (phase === "out") {
    avatarStyle = {
      transition: `transform ${LEG}ms ${EASE}, opacity ${LEG}ms ${EASE}`,
      transform: `translateX(${dir * -OFFSET}px) scale(0.9)`,
      opacity: 0,
    };
  } else if (phase === "in-start") {
    avatarStyle = {
      transition: "none",
      transform: `translateX(${dir * OFFSET}px) scale(0.9)`,
      opacity: 0,
    };
  } else if (phase === "in") {
    avatarStyle = {
      transition: `transform ${LEG}ms ${EASE}, opacity ${LEG}ms ${EASE}`,
      transform: "translateX(0) scale(1)",
      opacity: 1,
    };
  } else {
    avatarStyle = {
      transition: `transform ${LEG}ms ${EASE}, opacity ${LEG}ms ${EASE}`,
      transform: "translateX(0) scale(1)",
      opacity: 1,
    };
  }

  const nameVisible = phase === "idle" || phase === "in";

  return (
    <>
      {/* Header minimale */}
      <span
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.28em",
          color: "#6B7280",
          textTransform: "uppercase",
        }}
      >
        Rubinos Sellers
      </span>

      {/* Avatar + frecce */}
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 0,
        }}
      >
        <ArrowButton dir="left" onClick={() => change(-1)} />

        {/* box avatar a dimensione fissa: l'avatar non cambia mai dimensione */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <AvatarImage outfit={outfit} style={avatarStyle} />
        </div>

        <ArrowButton dir="right" onClick={() => change(1)} />
      </div>

      {/* Nome outfit */}
      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "0.04em",
          margin: "0 0 24px",
          textAlign: "center",
          textTransform: "uppercase",
          opacity: nameVisible ? 1 : 0,
          transition: `opacity ${LEG}ms ${EASE}`,
        }}
      >
        {outfit.name}
      </h1>

      {/* Pulsante principale */}
      <button
        type="button"
        onClick={() => onChoose(outfit)}
        style={{
          width: "100%",
          minHeight: 58,
          border: "none",
          borderRadius: 999,
          background: "#FFFFFF",
          color: "#000000",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "0.01em",
          cursor: "pointer",
        }}
      >
        Choose your outfit
      </button>
    </>
  );
}

function AvatarImage({
  outfit,
  style,
}: {
  outfit: Outfit;
  style: React.CSSProperties;
}) {
  const [ok, setOk] = useState(true);

  const shared: React.CSSProperties = {
    height: "100%",
    maxHeight: "52vh",
    width: "auto",
    maxWidth: "100%",
    ...style,
  };

  if (!ok) {
    return (
      <div
        style={{
          ...shared,
          aspectRatio: "3 / 5",
          borderRadius: 24,
          border: "1px dashed #262626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3F3F46",
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {outfit.name}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={outfit.image}
      alt={outfit.name}
      onError={() => setOk(false)}
      draggable={false}
      style={{
        ...shared,
        objectFit: "contain",
        userSelect: "none",
        WebkitUserDrag: "none",
      } as React.CSSProperties}
    />
  );
}

function SelectedState({
  outfit,
  onBack,
}: {
  outfit: Outfit;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.28em",
          color: "#6B7280",
          textTransform: "uppercase",
        }}
      >
        {outfit.name}
      </span>

      <h1
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        You selected
        <br />
        this outfit.
      </h1>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={() => {}}
          style={{
            width: "100%",
            minHeight: 58,
            border: "none",
            borderRadius: 999,
            background: "#FFFFFF",
            color: "#000000",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Continue
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 999,
            border: "1px solid #262626",
            background: "transparent",
            color: "#9CA3AF",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function ArrowButton({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Outfit precedente" : "Outfit successivo"}
      style={{
        flexShrink: 0,
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "1px solid #1F1F1F",
        background: "rgba(255,255,255,0.02)",
        color: "#E5E7EB",
        fontSize: 20,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      {dir === "left" ? "←" : "→"}
    </button>
  );
}
