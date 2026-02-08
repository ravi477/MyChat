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
            background: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(at 0% 0%, var(--accent-primary) 0px, transparent 50%), radial-gradient(at 100% 100%, var(--accent-secondary) 0px, transparent 50%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'var(--accent-primary)',
                filter: 'blur(120px)',
                opacity: 0.1,
                borderRadius: '50%',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'var(--accent-secondary)',
                filter: 'blur(100px)',
                opacity: 0.1,
                borderRadius: '50%',
                zIndex: 0
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '450px',
                padding: 'var(--spacing-md)'
            }}>
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <div style={{
                        width: '85px',
                        height: '85px',
                        margin: '0 auto 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img 
                            src="/logo.png" 
                            alt="FriendsChat Logo" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))'
                            }} 
                        />
                    </div>
                    <h1 style={{
                        fontSize: '46px',
                        fontWeight: 800,
                        marginBottom: '8px',
                        margin: '0 0 8px 0',
                        letterSpacing: '-1.5px',
                        color: 'var(--text-primary)',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 50%, #475569 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }}>
                        FriendsChat
                    </h1>
                    <p style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        opacity: 0.7,
                        fontWeight: 600
                    }}>
                        Premium Connectivity
                    </p>
                </div>

                <div
                    key={isLogin ? 'login' : 'signup'}
                    style={{
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        width: '100%'
                    }}
                >
                    {isLogin ? (
                        <Login onSwitchToSignUp={() => setIsLogin(false)} />
                    ) : (
                        <SignUp onSwitchToLogin={() => setIsLogin(true)} />
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
