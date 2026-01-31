import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

interface LoginModalProps {
    onLogin: (username: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)',
                        color: 'var(--accent-primary)'
                    }}>
                        <User size={32} />
                    </div>
                    <h2 style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        Welcome
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter your name to join the chat
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="input-field"
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: 'var(--font-size-lg)',
                                textAlign: 'center'
                            }}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!username.trim()}
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: 'var(--font-size-base)',
                            justifyContent: 'center'
                        }}
                    >
                        Join Chat
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
