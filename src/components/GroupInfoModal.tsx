import React, { useState } from 'react';
import Modal from './Modal';
import { Users, UserPlus, LogOut, Trash2, Shield, X } from 'lucide-react';
import type { Conversation } from '../data/mockData';

interface GroupInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Conversation;
    currentUserId: string;
    onAddMember: (userIds: string[]) => void;
    onRemoveMember: (userId: string) => void;
    onUpdateGroup: (name: string, avatar: string) => void;
    onPromoteAdmin: (userId: string) => void;
    onLeaveGroup: () => void;
    onDeleteGroup?: () => void;
    availableUsers: Conversation[]; // Users not in the group
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
    isOpen,
    onClose,
    group,
    currentUserId,
    onAddMember,
    onRemoveMember,
    onUpdateGroup,
    onPromoteAdmin,
    onLeaveGroup,
    onDeleteGroup,
    availableUsers
}) => {
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(group.name);
    const [editAvatar, setEditAvatar] = useState(group.avatar);
    const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = group.admins?.includes(currentUserId);
    const isCreator = group.createdBy === currentUserId;

    // Filter available users to those NOT in the group
    const potentialMembers = availableUsers.filter(u =>
        !group.members?.includes(u.id) &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleSelect = (userId: string) => {
        setSelectedNewMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddSubmit = () => {
        if (selectedNewMembers.length > 0) {
            onAddMember(selectedNewMembers);
            setIsAddingMembers(false);
            setSelectedNewMembers([]);
        }
    };

    const handleSaveEdit = () => {
        if (editName.trim()) {
            onUpdateGroup(editName, editAvatar);
            setIsEditing(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setIsAddingMembers(false);
                setIsEditing(false);
                setSelectedNewMembers([]);
                onClose();
            }}
            title={isAddingMembers ? "Add Members" : (isEditing ? "Edit Group" : "Group Info")}
        >
            <div style={{ minWidth: '350px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>

                {isAddingMembers ? (
                    <>
                        {/* Add Members View */}
                        <div style={{ marginBottom: '16px' }}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field"
                                style={{ width: '100%' }}
                                autoFocus
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {potentialMembers.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>
                                    No users found to add.
                                </p>
                            ) : (
                                potentialMembers.map(user => {
                                    const isSelected = selectedNewMembers.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => handleToggleSelect(user.id)}
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
                                                style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                                            />
                                            <span style={{ fontWeight: 500 }}>{user.name}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsAddingMembers(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSubmit}
                                className="btn btn-primary"
                                disabled={selectedNewMembers.length === 0}
                            >
                                Add Selected ({selectedNewMembers.length})
                            </button>
                        </div>
                    </>
                ) : isEditing ? (
                    <>
                        {/* Edit Group Info View */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Group Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter group name"
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avatar URL</label>
                                <input
                                    type="text"
                                    value={editAvatar}
                                    onChange={(e) => setEditAvatar(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter image URL"
                                />
                                {editAvatar && (
                                    <img
                                        src={editAvatar}
                                        alt="Preview"
                                        style={{ width: '60px', height: '60px', borderRadius: '15px', marginTop: '8px', objectFit: 'cover' }}
                                        onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=?')}
                                    />
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="btn btn-primary"
                                    disabled={!editName.trim()}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Group Header */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '24px',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '24px',
                            position: 'relative'
                        }}>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="icon-btn"
                                    style={{ position: 'absolute', top: 0, right: 0 }}
                                    title="Edit group"
                                >
                                    <Shield size={18} />
                                </button>
                            )}
                            <img
                                src={group.avatar}
                                alt={group.name}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '20px',
                                    objectFit: 'cover',
                                    marginBottom: '12px',
                                    backgroundColor: 'var(--bg-tertiary)'
                                }}
                            />
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{group.name}</h2>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                {group.members?.length} members
                            </p>
                        </div>

                        {/* Members List */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Members</h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsAddingMembers(true)}
                                        className="btn btn-ghost"
                                        style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                                    >
                                        <UserPlus size={16} style={{ marginRight: '4px' }} />
                                        Add
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {group.members?.map(memberId => {
                                    const memberName = group.memberNames?.[memberId] || 'Unknown User';
                                    const isMemberAdmin = group.admins?.includes(memberId);
                                    const isMe = memberId === currentUserId;

                                    return (
                                        <div key={memberId} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            backgroundColor: 'var(--bg-tertiary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: isMemberAdmin ? 'var(--accent-primary)' : 'var(--bg-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.85rem',
                                                    border: isMemberAdmin ? 'none' : '1px solid var(--border-color)'
                                                }}>
                                                    {memberName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {isMe ? 'You' : memberName}
                                                        {isMemberAdmin && <Shield size={12} color="#f59e0b" fill="#f59e0b" title="Admin" />}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {isAdmin && !isMemberAdmin && !isMe && (
                                                    <button
                                                        onClick={() => onPromoteAdmin(memberId)}
                                                        className="icon-btn"
                                                        style={{ width: '28px', height: '28px', color: 'var(--accent-primary)' }}
                                                        title="Promote to admin"
                                                    >
                                                        <Shield size={16} />
                                                    </button>
                                                )}
                                                {isAdmin && !isMe && (
                                                    <button
                                                        onClick={() => onRemoveMember(memberId)}
                                                        className="icon-btn"
                                                        style={{ width: '28px', height: '28px', color: '#ef4444' }}
                                                        title="Remove member"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={onLeaveGroup}
                                className="btn"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    justifyContent: 'center'
                                }}
                            >
                                <LogOut size={18} style={{ marginRight: '8px' }} />
                                Leave Group
                            </button>

                            {isAdmin && onDeleteGroup && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                            onDeleteGroup();
                                        }
                                    }}
                                    className="btn"
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                        color: '#ef4444',
                                        justifyContent: 'center',
                                        opacity: 0.8
                                    }}
                                >
                                    <Trash2 size={18} style={{ marginRight: '8px' }} />
                                    Delete Group
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default GroupInfoModal;
