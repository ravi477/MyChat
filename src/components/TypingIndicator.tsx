import React from 'react';

interface TypingIndicatorProps {
    userName?: string;
    isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                marginBottom: '8px',
                animation: 'fadeIn 0.2s ease-in'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {userName || 'Someone'} is typing
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <div className="typing-dot" style={{ animationDelay: '0s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-primary);
          animation: typingBounce 1.4s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default TypingIndicator;
