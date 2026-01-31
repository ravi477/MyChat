import React, { useState } from 'react';
import Modal from './Modal';
import { UserPlus, UserCircle2 } from 'lucide-react';

interface User {
    userId: string;
    username: string;
    socketId: string;
}

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateChat: (name: string) => void;
    onlineUsers?: User[];
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat, onlineUsers = [] }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreateChat(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Conversation">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)'
                    }}>
                        Recipient Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alice Smith"
                        className="input-field"
                        style={{ width: '100%' }}
                        autoFocus
                    />
                </div>

                {onlineUsers.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                        <p style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                            marginBottom: '8px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                        }}>
                            Online Users
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {onlineUsers.map(user => (
                                <button
                                    key={user.userId}
                                    type="button"
                                    onClick={() => {
                                        onCreateChat(user.username);
                                        onClose();
                                    }}
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                                >
                                    <UserCircle2 size={16} style={{ color: '#10b981' }} />
                                    <span>{user.username}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!name.trim()}
                    >
                        <UserPlus size={18} />
                        Start Chat
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default NewChatModal;
