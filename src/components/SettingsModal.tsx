import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Moon, Sun, Shield, Mail, Calendar, Fingerprint, Upload, Loader2,
    Settings, Ban, CircleUser, HelpCircle, AlertTriangle, LogOut,
    ChevronRight, ArrowLeft, Check, Archive
} from 'lucide-react';
import type { Conversation } from '../data/mockData';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout?: () => void;
    archivedIds: string[];
    blockedIds: string[];
    conversations: Conversation[];
    onUnarchive: (id: string) => void;
    onUnblock: (id: string) => void;
    keepArchived: boolean;
    onToggleKeepArchived: (val: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, onLogout,
    archivedIds, blockedIds, conversations,
    onUnarchive, onUnblock,
    keepArchived, onToggleKeepArchived
}) => {
    const { mode, color, toggleMode, setColor } = useTheme();
    const { currentUser, logout } = useAuth();
    const [activeView, setActiveView] = useState<'main' | 'preferences' | 'profile' | 'privacy' | 'archived' | 'blocked'>('main');

    const [name, setName] = useState(currentUser?.displayName || '');
    const [avatar, setAvatar] = useState(currentUser?.photoURL || '');
    const [newPassword, setNewPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!isOpen) {
            setActiveView('main');
            setMessage({ text: '', type: '' });
        }
    }, [isOpen]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !currentUser) return;

        const file = e.target.files[0];
        setUploading(true);
        setMessage({ text: '', type: '' });

        try {
            const storageRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setAvatar(downloadURL);
            setMessage({ text: 'Image uploaded! Click Save to apply.', type: 'success' });
        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage({ text: 'Failed to upload image.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await updateProfile(currentUser, { displayName: name, photoURL: avatar });
            await setDoc(doc(db, 'users', currentUser.uid), {
                name,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await updatePassword(currentUser, newPassword);
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            setTimeout(() => setActiveView('main'), 1500);
        } catch (err: any) {
            setMessage({ text: 'Error: Re-login required to change password.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAction = () => {
        if (onLogout) {
            onLogout();
        } else {
            logout();
        }
        onClose();
    };

    const colorOptions = [
        { id: 'blue', hex: '#3b82f6', name: 'Blue' },
        { id: 'purple', hex: '#8b5cf6', name: 'Purple' },
        { id: 'green', hex: '#10b981', name: 'Green' },
        { id: 'red', hex: '#ef4444', name: 'Red' },
        { id: 'yellow', hex: '#f59e0b', name: 'Amber' },
        { id: 'pink', hex: '#ec4899', name: 'Pink' }
    ];

    const renderHeader = () => {
        if (activeView === 'main') return null;
        const titles: Record<string, string> = {
            privacy: 'Privacy & Security',
            archived: 'Archived Chats',
            blocked: 'Blocked Accounts'
        };
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)'
                }}
                onClick={() => setActiveView('main')}
            >
                <div style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                }}>
                    <ArrowLeft size={18} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>
                    {titles[activeView]}
                </h3>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={activeView === 'main' ? "Settings" : ""}>
            <div style={{ position: 'relative' }}>
                {renderHeader()}

                {activeView === 'main' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* User Profile Card */}
                        <div
                            style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary, var(--accent-primary)) 100%)',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 4px 20px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.3)'
                            }}
                            onClick={() => setActiveView('profile')}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.3)';
                            }}
                        >
                            <img
                                src={currentUser?.photoURL || avatar || `https://ui-avatars.com/api/?name=User&background=random`}
                                style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '14px',
                                    objectFit: 'cover',
                                    border: '3px solid rgba(255,255,255,0.3)'
                                }}
                                alt="Profile"
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    color: 'white',
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {currentUser?.displayName || 'User'}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.8)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {currentUser?.email}
                                </div>
                            </div>
                            <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
                        </div>

                        {/* Menu Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <MenuItem icon={Settings} label="Preferences" onClick={() => setActiveView('preferences')} />
                            <MenuItem icon={Archive} label="Archived Chats" onClick={() => setActiveView('archived')} count={archivedIds.length} />
                            <MenuItem icon={Ban} label="Blocked Accounts" onClick={() => setActiveView('blocked')} count={blockedIds.length} />
                            <MenuItem icon={Shield} label="Privacy & Security" onClick={() => setActiveView('privacy')} />
                            <MenuItem icon={CircleUser} label="Accessibility" onClick={() => alert("Coming soon!")} />
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <MenuItem icon={HelpCircle} label="Help Center" />
                            <MenuItem icon={AlertTriangle} label="Report a Problem" />
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />

                        <MenuItem icon={LogOut} label="Log Out" onClick={handleLogoutAction} danger />
                    </div>
                )}

                {activeView === 'preferences' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Theme Toggle */}
                        <div>
                            <h4 style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Appearance
                            </h4>
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                background: 'var(--bg-tertiary)',
                                padding: '4px',
                                borderRadius: '14px'
                            }}>
                                <button
                                    onClick={() => mode !== 'light' && toggleMode()}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: mode === 'light' ? 'var(--bg-elevated)' : 'transparent',
                                        color: mode === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Sun size={18} /> Light
                                </button>
                                <button
                                    onClick={() => mode !== 'dark' && toggleMode()}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: mode === 'dark' ? 'var(--bg-elevated)' : 'transparent',
                                        color: mode === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Moon size={18} /> Dark
                                </button>
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div>
                            <h4 style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Accent Color
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '12px'
                            }}>
                                {colorOptions.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setColor(c.id as any)}
                                        title={c.name}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '12px',
                                            backgroundColor: c.hex,
                                            border: 'none',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transform: color === c.id ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.2s',
                                            boxShadow: color === c.id
                                                ? `0 4px 12px ${c.hex}50`
                                                : '0 2px 4px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {color === c.id && (
                                            <Check size={20} color="white" strokeWidth={3} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Settings */}
                        <div>
                            <h4 style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Chat Settings
                            </h4>
                            <div
                                onClick={() => onToggleKeepArchived(!keepArchived)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: 'rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--accent-primary)'
                                    }}>
                                        <Archive size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>Keep Chats Archived</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                            Archived chats will remain archived when you receive a message
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    width: '90px',
                                    height: '30px',
                                    borderRadius: '20px',
                                    background: keepArchived ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                    position: 'relative',
                                    transition: 'background 0.3s'
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '3px',
                                        left: keepArchived ? '32px' : '4px',
                                        transition: 'left 0.3s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'profile' && (
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Avatar Upload */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '24px',
                                        objectFit: 'cover',
                                        border: '4px solid var(--bg-tertiary)'
                                    }}
                                    alt="Avatar"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        right: '-4px',
                                        backgroundColor: 'var(--accent-primary)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: '3px solid var(--bg-secondary)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                marginBottom: '8px',
                                display: 'block',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Display Name
                            </label>
                            <input
                                className="input-field"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your Name"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    fontSize: '15px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Account Info Card */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <Mail size={16} style={{ opacity: 0.7 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <Calendar size={16} style={{ opacity: 0.7 }} />
                                <span>Joined {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <Fingerprint size={16} style={{ opacity: 0.7 }} />
                                <span>ID: {currentUser?.uid.slice(0, 12)}...</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.3)'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
                        </button>
                    </form>
                )}

                {activeView === 'privacy' && (
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                marginBottom: '8px',
                                display: 'block',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    fontSize: '15px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <p style={{
                                fontSize: '12px',
                                color: 'var(--text-tertiary)',
                                marginTop: '8px',
                                lineHeight: 1.5
                            }}>
                                Note: Changing password requires a recent login. If it fails, please log out and log in again.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '12px',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.3)'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                        </button>
                    </form>
                )}

                {activeView === 'archived' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {archivedIds.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <Archive size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No archived chats</p>
                            </div>
                        ) : (
                            archivedIds.map(id => {
                                const conv = conversations.find(c => c.id === id);
                                if (!conv) return null;
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '16px' }}>
                                        <img src={conv.avatar} style={{ width: '40px', height: '40px', borderRadius: conv.isGroup ? '10px' : '50%' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Archived</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onUnarchive(id); }}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                color: 'var(--accent-primary)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Unarchive
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeView === 'blocked' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {blockedIds.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <Ban size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No blocked users</p>
                            </div>
                        ) : (
                            blockedIds.map(id => {
                                // Blocked users are individual users, so find them in conversations (which handles privacy)
                                // or search by ID if they aren't in active conversations
                                const conv = conversations.find(c => c.id === id);
                                if (!conv) return null;
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '16px' }}>
                                        <img src={conv.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.name}</div>
                                            <div style={{ fontSize: '12px', color: '#ef4444' }}>Blocked</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onUnblock(id); }}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                color: 'var(--accent-primary)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Message Toast */}
                {message.text && (
                    <div style={{
                        marginTop: '20px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: message.type === 'error' ? '#ef4444' : '#10b981',
                        fontSize: '14px',
                        textAlign: 'center',
                        border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                        fontWeight: 500
                    }}>
                        {message.text}
                    </div>
                )}
            </div>
        </Modal >
    );
};

const MenuItem = ({ icon: Icon, label, onClick, danger, count }: {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    danger?: boolean;
    count?: number;
}) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 14px',
            cursor: onClick ? 'pointer' : 'default',
            borderRadius: '12px',
            transition: 'background 0.15s',
            color: danger ? '#ef4444' : 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 500,
            opacity: onClick ? 1 : 0.6
        }}
        onMouseEnter={(e) => onClick && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
        onMouseLeave={(e) => onClick && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
        <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon size={18} strokeWidth={1.8} />
        </div>
        <span style={{ flex: 1 }}>{label}</span>
        {count !== undefined && count > 0 && (
            <span style={{
                background: danger ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-primary)',
                color: danger ? '#ef4444' : 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                marginRight: '8px'
            }}>
                {count}
            </span>
        )}
        {onClick && !danger && <ChevronRight size={16} color="var(--text-tertiary)" />}
    </div>
);

export default SettingsModal;
