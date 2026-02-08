import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface Props {
    onRefresh: () => void;
    onDismiss: () => void;
}

const RefreshPrompt: React.FC<Props> = ({ onRefresh, onDismiss }) => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                    Call Ended
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Refresh to ensure camera is released
                </p>
            </div>

            <button
                onClick={onRefresh}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
            >
                <RefreshCw size={14} />
                Refresh
            </button>

            <button
                onClick={onDismiss}
                style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={16} />
            </button>

            <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
};

export default RefreshPrompt;
