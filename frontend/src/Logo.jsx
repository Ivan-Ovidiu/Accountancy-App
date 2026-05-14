import { useContext, createContext } from "react";

// Re-import ThemeContext directly to avoid circular dependency with App.jsx
// App.jsx exports ThemeContext, Logo.jsx imports only that — not useTheme from App
import { ThemeContext } from "./App";

function hexToFilter(hex) {
    const filters = {
        "#a78bfa": "invert(67%) sepia(40%) saturate(800%) hue-rotate(210deg) brightness(110%)",
        "#7c3aed": "invert(25%) sepia(80%) saturate(1200%) hue-rotate(250deg) brightness(80%)",
    };
    return filters[hex?.toLowerCase()] || "invert(67%) sepia(40%) saturate(800%) hue-rotate(210deg) brightness(110%)";
}

export function LogoMark({ size = 32, color }) {
    const T = useContext(ThemeContext);
    const c = color || T?.accent || "#a78bfa";
    return (
        <img
            src="/Logo.svg"
            alt="AccountBud logo mark"
            width={size}
            height={Math.round(size * 0.6)}
            style={{
                display: "block",
                flexShrink: 0,
                filter: `brightness(0) saturate(100%) ${hexToFilter(c)}`,
            }}
        />
    );
}
export function LogoFull({ size = 32, color, textColor }) {
    const T = useContext(ThemeContext);
    const c      = color     || T?.accent || "#a78bfa";
    const textC  = textColor || T?.text   || "#fff";
    const textSize = size > 36 ? 20 : size > 24 ? 16 : 13;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: size > 28 ? 10 : 7 }}>
            <LogoMark size={size} color={c} />
            <span style={{ fontSize: textSize, fontWeight: 700, letterSpacing: "-0.4px", color: textC, fontFamily: "'Outfit', sans-serif", lineHeight: 1, userSelect: "none" }}>
                AccountBud
            </span>
        </div>
    );
}

export default LogoFull;