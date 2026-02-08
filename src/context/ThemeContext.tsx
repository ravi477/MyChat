
import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink';

interface ThemeContextType {
    mode: ThemeMode;
    color: ThemeColor;
    toggleMode: () => void;
    setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load theme from localStorage or use defaults
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('theme-mode');
        return (saved as ThemeMode) || 'dark';
    });

    const [color, setColorState] = useState<ThemeColor>(() => {
        const saved = localStorage.getItem('theme-color');
        return (saved as ThemeColor) || 'blue';
    });

    // Apply theme to DOM
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode);
        document.documentElement.setAttribute('data-color', color);
    }, [mode, color]);

    // Save mode to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('theme-mode', mode);
    }, [mode]);

    // Save color to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('theme-color', color);
    }, [color]);

    const toggleMode = () => {
        setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setColor = (newColor: ThemeColor) => {
        setColorState(newColor);
    };

    return (
        <ThemeContext.Provider value={{ mode, color, toggleMode, setColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
