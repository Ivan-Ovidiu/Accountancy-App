import { useContext, createContext } from "react";

// Re-import ThemeContext directly to avoid circular dependency with App.jsx
// App.jsx exports ThemeContext, Logo.jsx imports only that — not useTheme from App
import { ThemeContext } from "./App";

function hexToFilter(hex) {
    const filters = {
        "#a78bfa": "invert(63%) sepia(55%) saturate(600%) hue-rotate(210deg) brightness(105%) contrast(95%)",
        "#7c3aed": "invert(22%) sepia(90%) saturate(800%) hue-rotate(250deg) brightness(85%) contrast(110%)",
    };
    return filters[hex?.toLowerCase()] || "invert(63%) sepia(55%) saturate(600%) hue-rotate(210deg) brightness(105%) contrast(95%)";
}

export function LogoMark({ size = 32, color }) {
    const T = useContext(ThemeContext);
    const c = color || T?.accent || "#a78bfa";
    return (
        <img
            src="/Logo.svg"
            alt="AccountBud logo mark"
            width={size}
            height={Math.round(size * 0.58)}
            style={{ display: "block", filter: hexToFilter(c), flexShrink: 0 }}
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