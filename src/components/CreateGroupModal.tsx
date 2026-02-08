import React, { useState } from 'react';
import Modal from './Modal';
import { Users, Check } from 'lucide-react';
import type { Conversation } from '../data/mockData';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateGroup: (groupData: {
        name: string;
        members: string[];
        avatar?: string;
    }) => void;
    availableUsers: Conversation[]; // List of users to select from
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    onCreateGroup,
    availableUsers
}) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [step, setStep] = useState<'members' | 'details'>('members');

    const handleMemberToggle = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleNext = () => {
        // Allow 0 members for solo groups
        setStep('details');
    };

    const handleBack = () => {
        setStep('members');
    };

    const handleSubmit = () => {
        if (groupName.trim()) {
            onCreateGroup({
                name: groupName.trim(),
                members: selectedMembers,
                avatar: avatarUrl || undefined
            });
            // Reset form
            setGroupName('');
            setSelectedMembers([]);
            setAvatarUrl('');
            setStep('members');
            onClose();
        }
    };

    const handleClose = () => {
        setGroupName('');
        setSelectedMembers([]);
        setAvatarUrl('');
        setStep('members');
        onClose();
    };

    // Filter out group chats, only show individual users
    const individualUsers = availableUsers.filter(u => !u.isGroup);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 'members' ? 'Select Group Members' : 'Group Details'}
        >
            <div style={{ minWidth: '350px' }}>
                {step === 'members' ? (
                    <>
                        {/* Member Selection */}
                        <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-tertiary)',
                            marginBottom: '16px'
                        }}>
                            Select members (Optional)
                        </p>

                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {individualUsers.length === 0 ? (
                                <p style={{
                                    textAlign: 'center',
                                    color: 'var(--text-tertiary)',
                                    padding: '24px'
                                }}>
                                    No other users found. You can still create a group for yourself.
                                </p>
                            ) : (
                                individualUsers.map(user => {
                                    const isSelected = selectedMembers.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => handleMemberToggle(user.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                backgroundColor: isSelected
                                                    ? 'rgba(var(--accent-rgb, 99, 102, 241), 0.15)'
                                                    : 'var(--bg-tertiary)',
                                                border: isSelected
                                                    ? '2px solid var(--accent-primary)'
                                                    : '2px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{user.name}</div>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: user.status === 'online' ? '#10b981' : 'var(--text-tertiary)'
                                                }}>
                                                    {user.status}
                                                </div>
                                            </div>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                                                border: isSelected ? 'none' : '2px solid var(--border-color)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isSelected && <Check size={14} color="white" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Selected count */}
                        {selectedMembers.length > 0 && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px 12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Users size={16} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                                </span>
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '20px'
                        }}>
                            <button className="btn btn-ghost" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Group Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Avatar Preview */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Group"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <Users size={36} color="white" />
                                    )}
                                </div>
                            </div>

                            {/* Group Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px'
                                }}>
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Enter group name..."
                                    className="input-field"
                                    style={{ width: '100%' }}
                                    autoFocus
                                />
                            </div>

                            {/* Avatar URL (optional) */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px'
                                }}>
                                    Group Icon URL (optional)
                                </label>
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Members Preview */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px'
                                }}>
                                    Members ({selectedMembers.length + 1} including you)
                                </label>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}>
                                    {selectedMembers.map(memberId => {
                                        const member = individualUsers.find(u => u.id === memberId);
                                        return member ? (
                                            <div
                                                key={memberId}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    borderRadius: '16px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                                {member.name}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '24px'
                        }}>
                            <button className="btn btn-ghost" onClick={handleBack}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={!groupName.trim()}
                            >
                                <Users size={18} />
                                Create Group
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CreateGroupModal;
