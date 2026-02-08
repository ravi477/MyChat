import React, { useState, useRef } from 'react';
import { Smile, MoreVertical, Edit2, Trash2, X, Check, Reply } from 'lucide-react';
import MessageStatus from './MessageStatus';
import ImageLightbox from './ImageLightbox';

interface MessageBubbleProps {
    id: string;
    text: string;
    isMe: boolean;
    timestamp: string;
    image?: string;
    reactions?: Record<string, number>;
    onReact: (id: string, emoji: string) => void;
    onEdit: (id: string, newText: string) => void;
    onDelete: (id: string, forEveryone: boolean) => void;
    onReply?: (message: { id: string; text: string; sender: string; image?: string }) => void;
    isEdited?: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    replyTo?: {
        id: string;
        text: string;
        sender: string;
        image?: string;
    };
    isHighlighted?: boolean;
    senderName?: string;
    senderAvatar?: string;
}

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];


const MessageBubble: React.FC<MessageBubbleProps> = ({ id, text, isMe, timestamp, image, reactions, onReact, onEdit, onDelete, onReply, isEdited, status, replyTo, isHighlighted, senderName, senderAvatar }) => {
    const isDeleted = text === "🚫 This message was deleted";
    const [showReactions, setShowReactions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReactionMenu, setShowReactionMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(text);
    const [showLightbox, setShowLightbox] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setShowReactions(true);
    };

    const handleMouseLeave = () => {
        timerRef.current = setTimeout(() => {
            if (!showMenu && !showReactionMenu) {
                setShowReactions(false);
            }
        }, 300);
    };

    const handleSaveEdit = () => {
        if (editText.trim() !== text) {
            onEdit(id, editText);
        }
        setIsEditing(false);
    };

    return (
        <div
            className="animate-slide-in message-group"
            style={{
                display: 'flex',
                alignItems: 'flex-end', // Alignment for 3-dots
                flexDirection: isMe ? 'row-reverse' : 'row',
                marginBottom: 'var(--spacing-md)',
                maxWidth: '85%', // increased slightly
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                position: 'relative',
                gap: '8px',
                // Highlight styling when this message is being replied to
                ...(isHighlighted && {
                    backgroundColor: 'var(--accent-primary)',
                    padding: '8px',
                    marginLeft: isMe ? '0' : '-8px',
                    marginRight: isMe ? '-8px' : '0',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 2px var(--accent-primary), 0 4px 20px rgba(var(--accent-rgb, 99, 102, 241), 0.3)',
                    animation: 'highlightPulse 1.5s ease-in-out infinite'
                })
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Highlight animation keyframes */}
            {isHighlighted && (
                <style>{`
                    @keyframes highlightPulse {
                        0%, 100% { opacity: 0.15; }
                        50% { opacity: 0.25; }
                    }
                `}</style>
            )}

            {/* Sender Avatar (Groups - Others Only) */}
            {!isMe && senderAvatar && (
                <img
                    src={senderAvatar}
                    alt={senderName}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        marginBottom: '4px', // Align with bottom of message
                        objectFit: 'cover'
                    }}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', flex: 1, maxWidth: '100%' }}>

                {/* Sender Name (Groups - Others Only) */}
                {!isMe && senderName && (
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '2px',
                        marginLeft: '4px',
                        fontWeight: 500
                    }}>
                        {senderName}
                    </span>
                )}

                <div style={{ position: 'relative' }}>
                    {/* Side Actions: Reactions + Buttons (Centered Vertically) */}
                    <div style={{
                        position: 'absolute',
                        [isMe ? 'right' : 'left']: 'calc(100% + 8px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        zIndex: 10,
                        pointerEvents: 'none' // Container doesn't block, children do
                    }}>



                        {/* 2. Action Buttons & Popups */}
                        {(showReactions || showMenu || showReactionMenu) && !isEditing && !isDeleted && (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', pointerEvents: 'auto' }}>
                                {/* Reaction Trigger Button */}
                                <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                                    <button
                                        onClick={() => setShowReactionMenu(!showReactionMenu)}
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            padding: 0
                                        }}
                                        title="Add Reaction"
                                    >
                                        <Smile size={14} />
                                    </button>

                                    {/* Reaction Picker Popup */}
                                    {showReactionMenu && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: isMe ? 'auto' : 0,
                                            right: isMe ? 0 : 'auto',
                                            marginBottom: '4px',
                                            backgroundColor: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '24px',
                                            padding: '4px 8px',
                                            display: 'flex',
                                            gap: '4px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            zIndex: 40,
                                            width: 'max-content'
                                        }}>
                                            {REACTION_OPTIONS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => { onReact(id, emoji); setShowReactionMenu(false); }}
                                                    className="emoji-btn"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '18px',
                                                        padding: '2px',
                                                        transition: 'transform 0.1s'
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Reply Button */}
                                {!isDeleted && onReply && (
                                    <button
                                        onClick={() => onReply({ id, text, sender: isMe ? 'me' : 'other', image })}
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            padding: 0
                                        }}
                                        title="Reply"
                                    >
                                        <Reply size={14} />
                                    </button>
                                )}

                                {/* Menu Trigger */}
                                {isMe && (
                                    <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-tertiary)',
                                                cursor: 'pointer',
                                                padding: '0',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px'
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Menu Popup */}
                                        {showMenu && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '100%',
                                                right: 0,
                                                backgroundColor: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                padding: '4px',
                                                minWidth: '140px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                zIndex: 30,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px'
                                            }}>
                                                <button onClick={() => { setIsEditing(true); setShowMenu(false); }} style={menuItemStyle}>
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button onClick={() => onDelete(id, true)} style={{ ...menuItemStyle, color: '#ef4444' }}>
                                                    <Trash2 size={14} /> Delete Everyone
                                                </button>
                                                <button onClick={() => onDelete(id, false)} style={menuItemStyle}>
                                                    <Trash2 size={14} /> Delete for Me
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}


                    </div>

                    {/* Layer 15: Reactions Display (Bottom Corner) */}
                    {reactions && Object.keys(reactions).length > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '-22px',
                            [isMe ? 'left' : 'right']: '12px',
                            display: 'flex',
                            gap: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '12px',
                            padding: '2px 6px',
                            border: '2px solid var(--bg-primary)',
                            filter: isDeleted ? 'grayscale(1)' : 'none',
                            opacity: isDeleted ? 0.6 : 1,
                            zIndex: 15,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            pointerEvents: 'auto'
                        }}
                            onMouseEnter={handleMouseEnter}
                        >
                            {Object.entries(reactions).map(([emoji, count]) => (
                                <span key={emoji} style={{ fontSize: '12px' }}>{emoji} {count > 1 && count}</span>
                            ))}
                        </div>
                    )}



                    {/* Layer 5: Bubble Content */}
                    <div style={{
                        padding: image ? '4px' : (isDeleted ? '6px 10px' : '8px 14px'),
                        borderRadius: '20px',
                        borderBottomRightRadius: isMe ? '4px' : '20px',
                        borderBottomLeftRadius: isMe ? '20px' : '4px',
                        backgroundColor: isDeleted ? 'transparent' : (isMe ? 'var(--accent-primary)' : 'var(--bg-elevated)'),
                        color: isDeleted ? 'var(--text-tertiary)' : (isMe ? '#ffffff' : 'var(--text-primary)'),
                        fontStyle: isDeleted ? 'italic' : 'normal',
                        boxShadow: isDeleted ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                        fontSize: isDeleted ? '0.75rem' : '0.9rem',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        border: isDeleted ? '1px dashed var(--border-color)' : (!isMe ? '1px solid var(--border-color)' : 'none'),
                        position: 'relative',
                        minWidth: isEditing ? '200px' : 'auto',
                        opacity: isDeleted ? 0.7 : 1,
                        filter: isDeleted ? 'grayscale(1)' : 'none',
                        zIndex: 5
                    }}>
                        {/* Reply Quote Preview */}
                        {replyTo && !isEditing && (
                            <div style={{
                                backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.5)' : 'var(--accent-primary)'}`,
                                borderRadius: '4px',
                                padding: '8px 12px',
                                marginBottom: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}>
                                <div style={{
                                    fontWeight: 600,
                                    marginBottom: '2px',
                                    opacity: 0.9,
                                    fontSize: '0.75rem'
                                }}>
                                    {replyTo.sender === 'me' ? 'You' : 'Them'}
                                </div>
                                {replyTo.image && (
                                    <img
                                        src={replyTo.image}
                                        alt="replied"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            marginBottom: '4px'
                                        }}
                                    />
                                )}
                                <div style={{
                                    opacity: 0.8,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '200px'
                                }}>
                                    {replyTo.text || '📷 Photo'}
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        color: 'inherit',
                                        outline: 'none',
                                        width: '100%'
                                    }}
                                />
                                <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><Check size={16} /></button>
                                <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                {image && (
                                    <>
                                        <img
                                            src={image}
                                            alt="attachment"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '300px',
                                                width: 'auto',
                                                objectFit: 'cover',
                                                borderRadius: '16px',
                                                marginBottom: text ? '8px' : '0',
                                                display: 'block',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onClick={() => setShowLightbox(true)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        />
                                        <ImageLightbox
                                            imageUrl={image}
                                            isOpen={showLightbox}
                                            onClose={() => setShowLightbox(false)}
                                        />
                                    </>
                                )}
                                {text && <span style={{ padding: image ? '8px 12px' : '0' }}>{text}</span>}
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {!isEditing && (
                        <span style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-tertiary)',
                            marginLeft: isMe ? 0 : '8px',
                            marginRight: isMe ? '8px' : 0,
                            fontWeight: 500
                        }}>
                            {timestamp}
                        </span>
                    )}
                    {isEdited && !isDeleted && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontStyle: 'italic', opacity: 0.8 }}>
                            (edited)
                        </span>
                    )}
                    {/* Message Status - Only for sender */}
                    <MessageStatus status={status} timestamp={timestamp} isSender={isMe} />


                </div>
            </div>
        </div>
    );
};

const menuItemStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '8px 12px',
    textAlign: 'left' as const,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
};

export default MessageBubble;
