import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import { MessageSquare } from 'lucide-react';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            padding: 'var(--spacing-md)'
        }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'var(--accent-primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--spacing-md)',
                    color: 'white',
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)'
                }}>
                    <MessageSquare size={32} fill="white" />
                </div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, white 0%, rgba(255,255,255,0.7) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Messenger
                </h1>
            </div>

            {isLogin ? (
                <Login onSwitchToSignUp={() => setIsLogin(false)} />
            ) : (
                <SignUp onSwitchToLogin={() => setIsLogin(true)} />
            )}
        </div>
    );
};

export default AuthPage;
