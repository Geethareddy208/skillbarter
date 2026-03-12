// ─────────────────────────────────────────────
//  SkillBarter — Theme Context (Dark / Light)
// ─────────────────────────────────────────────
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(false);

    const theme = {
        dark,
        toggle: () => setDark((d) => !d),

        // Backgrounds
        bg: dark ? "#0D0D0D" : "#F8F8F4",
        cardBg: dark ? "#1A1A1A" : "#FFFFFF",
        navBg: dark ? "#111111" : "#FFFFFF",
        inputBg: dark ? "#222222" : "#F3F3EE",
        hoverBg: dark ? "#2A2A2A" : "#F3F3EE",

        // Borders
        cardBorder: dark ? "#2A2A2A" : "#E8E8E0",

        // Text
        textPrimary: dark ? "#F5F5F0" : "#0A0A0A",
        textSecondary: dark ? "#888888" : "#666666",

        // Brand
        yellow: "#FFD600",
        yellowHover: "#F5C800",
        black: "#0A0A0A",
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
