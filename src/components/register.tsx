import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Registers as RegistersType } from "../functions/types";
import { useTheme } from "../contexts/ThemeContext";

interface RegisterData {
  A: [string, string];
  B: [string, string];
  C: [string, string];
  D: [string, string];
  E: [string, string];
  H: [string, string];
  L: [string, string];
}

/* ─── colour palette per register ─── */
const REG_COLORS: Record<string, string> = {
  A: "#38bdf8",
  B: "#a78bfa",
  C: "#22d3ee",
  D: "#f97316",
  E: "#ec4899",
  H: "#6366f1",
  L: "#34d399",
};

export default function Registers() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [registers, setRegisters] = useState<RegisterData>({
    A: ["0", "0"],
    B: ["0", "0"],
    C: ["0", "0"],
    D: ["0", "0"],
    E: ["0", "0"],
    H: ["0", "0"],
    L: ["0", "0"],
  });

  /* UI-only — no event wiring */
  const [pc] = useState("0000");
  const [sp] = useState("FFFF");

  const prevRegisters = useRef<RegisterData | null>(null);
  const registerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    A: null, B: null, C: null, D: null, E: null, H: null, L: null,
  });
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const handleSetRegisters = (e: CustomEvent) => {
      const next: RegistersType = e.detail;

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setRegisters(next as RegisterData);
        prevRegisters.current = next as RegisterData;
        return;
      }

      Object.keys(next).forEach((key) => {
        const regKey = key as keyof RegisterData;
        if (
          prevRegisters.current &&
          (next[regKey][0] !== prevRegisters.current[regKey][0] ||
            next[regKey][1] !== prevRegisters.current[regKey][1])
        ) {
          const ref = registerRefs.current[key];
          if (ref) {
            gsap.to(ref, {
              scale: 1.06,
              duration: 0.35,
              ease: "power2.out",
              yoyo: true,
              repeat: 1,
            });
          }
        }
      });

      setRegisters(next as RegisterData);
      prevRegisters.current = next as RegisterData;
    };

    const handleRequestRegisters = () => {
      window.dispatchEvent(
        new CustomEvent("getRegisters", { detail: registers })
      );
    };

    window.addEventListener("setRegisters", handleSetRegisters as EventListener);
    window.addEventListener("requestRegisters", handleRequestRegisters);

    return () => {
      window.removeEventListener("setRegisters", handleSetRegisters as EventListener);
      window.removeEventListener("requestRegisters", handleRequestRegisters);
    };
  }, [registers]);

  const updateRegister = (register: keyof RegisterData, index: 0 | 1, value: string) => {
    setRegisters((prev) => ({
      ...prev,
      [register]: [
        index === 0 ? value : prev[register][0],
        index === 1 ? value : prev[register][1],
      ],
    }));
  };

  /* ─── styles ─── */
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#f1f5f9" : "#1e293b";
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  /* ─── single register card ─── */
  const RegisterCard = ({
    letter,
    values,
    fullWidth = false,
  }: {
    letter: string;
    values: [string, string];
    fullWidth?: boolean;
  }) => {
    const accent = REG_COLORS[letter] || "#38bdf8";
    return (
      <div
        ref={(el) => { registerRefs.current[letter] = el; }}
        style={{
          flex: fullWidth ? "1 1 100%" : "1 1 calc(50% - 4px)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderLeft: `3px solid ${accent}`,
          transition: "all 0.3s ease",
        }}
      >
        {/* Letter */}
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: accent,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minWidth: "24px",
          }}
        >
          {letter}
        </span>

        {/* Hex inputs */}
        <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
          {[0, 1].map((idx) => (
            <input
              key={idx}
              type="text"
              value={values[idx as 0 | 1]}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 1);
                updateRegister(letter as keyof RegisterData, idx as 0 | 1, val);
              }}
              maxLength={1}
              style={{
                width: "32px",
                height: "32px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: textPrimary,
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = accent; }}
              onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
            />
          ))}
        </div>
      </div>
    );
  };

  /* ─── 16-bit special register display (PC / SP) ─── */
  const SpecialRegister = ({
    label,
    short,
    value,
    color,
  }: {
    label: string;
    short: string;
    value: string;
    color: string;
  }) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: `${color}10`,
        border: `1px solid ${color}25`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {short}
        </span>
        <span style={{ fontSize: "9px", color: textMuted, textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "2px",
        }}
      >
        {value.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "28px",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: textPrimary,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderRadius: "4px",
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        height: "100%",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: isDark ? "#1a1a2e" : "#f8fafc",
        borderRadius: "12px",
        overflow: "auto",
      }}
    >
      {/* Section title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "6px",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a78bfa" : "#7c3aed"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
          }}
        >
          Registers
        </span>
      </div>

      {/* Accumulator — hero card */}
      <RegisterCard letter="A" values={registers.A} fullWidth />

      {/* Register pairs (B-C, D-E, H-L) */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <RegisterCard letter="B" values={registers.B} />
        <RegisterCard letter="C" values={registers.C} />
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <RegisterCard letter="D" values={registers.D} />
        <RegisterCard letter="E" values={registers.E} />
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <RegisterCard letter="H" values={registers.H} />
        <RegisterCard letter="L" values={registers.L} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, margin: "2px 0" }} />

      {/* PC + SP */}
      <div style={{ display: "flex", gap: "8px" }}>
        <SpecialRegister label="Program Counter" short="PC" value={pc} color="#f59e0b" />
        <SpecialRegister label="Stack Pointer" short="SP" value={sp} color="#10b981" />
      </div>
    </div>
  );
}