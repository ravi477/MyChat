import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { theme } = useTheme();

    return (
        <div
            data-theme={theme}
            style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                backgroundColor: 'var(--bg-primary)',
                backgroundImage: theme === 'dark'
                    ? 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.1), transparent 50%)'
                    : 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.1), transparent 50%), radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.05), transparent 50%)',
                overflow: 'hidden',
                padding: 'var(--spacing-md)',
                transition: 'background-image 0.5s ease'
            }}
        >
            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
                position: 'relative'
            }}>
                {children}
            </div>
        </div>
    );
};

export default Layout;
