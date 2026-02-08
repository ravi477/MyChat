import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { mode } = useTheme();

    return (
        <div
            data-mode={mode}
            style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                backgroundColor: 'var(--bg-primary)',
                backgroundImage: 'radial-gradient(ellipse at top right, var(--accent-primary), transparent 70%), radial-gradient(ellipse at bottom left, var(--accent-secondary), transparent 70%)',
                backgroundSize: '200% 200%',
                backgroundPosition: '0% 0%',
                overflow: 'hidden',
                padding: 'var(--spacing-md)',
                transition: 'background-image 0.5s ease',
                opacity: 0.95 // Reduce intensity slightly
            }}
        >
            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--glass-bg)',
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
