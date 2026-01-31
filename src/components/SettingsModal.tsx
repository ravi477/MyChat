
import React from 'react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Bell, Shield, User } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px'
                }}>
                    Appearance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <SettingItem
                        icon={Sun}
                        label="Light"
                        active={theme === 'light'}
                        onClick={() => theme === 'dark' && toggleTheme()}
                    />
                    <SettingItem
                        icon={Moon}
                        label="Dark"
                        active={theme === 'dark'}
                        onClick={() => theme === 'light' && toggleTheme()}
                    />
                </div>
            </div>

            <div>
                <h3 style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px'
                }}>
                    General
                </h3>
                <SettingItem icon={User} label="Profile" value="Edit" />
                <SettingItem icon={Bell} label="Notifications" value="On" />
                <SettingItem icon={Shield} label="Privacy" />
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                Messenger App v1.0.0
            </div>
        </Modal>
    );
};

const SettingItem = ({ icon: Icon, label, value, onClick, active }: { icon: React.ElementType, label: string, value?: string, onClick?: () => void, active?: boolean }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: active ? 'var(--bg-target)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            marginBottom: '8px',
            border: active ? '1px solid var(--accent-primary)' : '1px solid transparent'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: active ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}>
                <Icon size={20} />
            </div>
            <span style={{
                color: 'var(--text-primary)',
                fontWeight: 500
            }}>
                {label}
            </span>
        </div>
        {value && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                {value}
            </span>
        )}
    </div>
);

export default SettingsModal;
