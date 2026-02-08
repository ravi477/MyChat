
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send, MessageSquare, Image as ImageIcon, X, Loader2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import type { Conversation, Message } from '../data/mockData';
import { useCall } from '../context/CallContext';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

interface ChatWindowProps {
    conversation?: Conversation;
    messages: Message[];
    onSendMessage: (text: string, image?: string, replyTo?: { id: string; text: string; sender: string; image?: string }) => void;
    onReact: (messageId: string, emoji: string) => void;
    onEdit: (messageId: string, newText: string) => void;
    onDelete: (messageId: string, deleteForEveryone: boolean) => void;
    onTyping?: (isTyping: boolean) => void;
    typingUser?: { userId: string; userName: string } | null;
    onGroupInfo?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, messages, onSendMessage, onReact, onEdit, onDelete, onTyping, typingUser, onGroupInfo }) => {
    const { callUser } = useCall();
    const { currentUser } = useAuth();
    const [inputValue, setInputValue] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; sender: string; image?: string } | null>(null);

    // Search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]); // Array of message IDs
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedImage]);

    // Search logic - filter messages when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = messages
            .filter(msg => msg.text.toLowerCase().includes(query))
            .map(msg => msg.id);

        setSearchResults(results);
        setCurrentSearchIndex(results.length > 0 ? 0 : -1);

        // Scroll to first result
        if (results.length > 0) {
            scrollToMessage(results[0]);
        }
    }, [searchQuery, messages]);

    const scrollToMessage = (messageId: string) => {
        const element = messageRefs.current[messageId];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const navigateSearch = (direction: 'prev' | 'next') => {
        if (searchResults.length === 0) return;

        let newIndex: number;
        if (direction === 'next') {
            newIndex = (currentSearchIndex + 1) % searchResults.length;
        } else {
            newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        }

        setCurrentSearchIndex(newIndex);
        scrollToMessage(searchResults[newIndex]);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setCurrentSearchIndex(0);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size must be less than 10MB');
                return;
            }

            // Store file for upload and create preview
            setPendingFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again
        if (e.target) e.target.value = '';
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);

        if (onTyping) {
            // Emit typing start
            onTyping(true);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to emit typing stop after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 2000);
        }
    };

    if (!conversation || conversation.id === 'empty') {
        return (
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-xl)',
                background: 'transparent',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--spacing-lg)',
                    color: 'var(--accent-primary)',
                    // boxShadow removed for cleaner look
                    border: '1px solid var(--border-color)'
                }}>
                    <MessageSquare size={40} fill="currentColor" opacity={0.2} />
                </div>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                    Your Messages
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
                    Select a conversation to start chatting or find someone new to message.
                </p>
            </main>
        );
    }

    const handleSend = async () => {
        if (!inputValue.trim() && !pendingFile) return;
        if (isUploading) return;

        let imageUrl: string | undefined;

        // Upload image to Firebase Storage if there's a pending file
        if (pendingFile && currentUser) {
            setIsUploading(true);
            try {
                const timestamp = Date.now();
                const fileExt = pendingFile.name.split('.').pop() || 'jpg';
                const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const storageRef = ref(storage, `chat_images/${currentUser.uid}/${fileName}`);

                const snapshot = await uploadBytes(storageRef, pendingFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error('Image upload failed:', error);
                alert('Failed to upload image. Please try again.');
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        onSendMessage(inputValue, imageUrl, replyingTo || undefined);
        setInputValue('');
        setSelectedImage(null);
        setPendingFile(null);
        setReplyingTo(null); // Clear reply after sending

        // Stop typing indicator when message is sent
        if (onTyping) {
            onTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!conversation) {
        return (
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-tertiary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <MessageSquare size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Welcome to Anti-Gravity
                    </h2>
                    <p>Select a message or start a new conversation to begin</p>
                </div>
            </main>
        );
    }

    const getStatusColor = (status: Conversation['status'] | undefined) => {
        if (!status) return '#94a3b8';
        switch (status) {
            case 'online': return '#10b981';
            case 'busy': return '#ef4444';
            case 'away': return '#eab308';
            case 'offline': return '#94a3b8';
            default: return '#94a3b8';
        }
    };

    const getStatusText = (status: Conversation['status'] | undefined) => {
        if (!status) return 'Unavailable';
        switch (status) {
            case 'online': return 'Online';
            case 'busy': return 'Do not disturb';
            case 'away': return 'Away';
            case 'offline': return 'Unavailable';
            default: return 'Unavailable';
        }
    };

    const statusColor = getStatusColor(conversation.status);
    const statusText = getStatusText(conversation.status);

    return (
        <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '0 var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(var(--backdrop-blur))',
                height: '80px', // Taller header
                borderBottom: '1px solid var(--glass-border)',
                zIndex: 20
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '13px',
                            height: '13px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            border: '2.5px solid var(--bg-primary)'
                        }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>{conversation.name}</h2>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: statusColor, fontWeight: 500 }}>
                            {statusText}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <button className="icon-btn" title="Voice Call" onClick={() => conversation && callUser(conversation.id, false)}>
                        <Phone size={20} />
                    </button>
                    <button className="icon-btn" title="Video Call" onClick={() => conversation && callUser(conversation.id, true)}>
                        <Video size={20} />
                    </button>
                    <button
                        className="icon-btn"
                        title="Search Messages"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        style={{
                            backgroundColor: isSearchOpen ? 'var(--accent-primary)' : undefined,
                            color: isSearchOpen ? 'white' : undefined
                        }}
                    >
                        <Search size={20} />
                    </button>
                    <button className="icon-btn" title="More Options" onClick={onGroupInfo}>
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
                <div style={{
                    padding: '12px var(--spacing-xl)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'slideDown 0.2s ease'
                }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '24px',
                        padding: '8px 16px',
                        gap: '8px'
                    }}>
                        <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                            style={{
                                flex: 1,
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem'
                            }}
                        />
                        {searchQuery && (
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-tertiary)',
                                whiteSpace: 'nowrap'
                            }}>
                                {searchResults.length > 0
                                    ? `${currentSearchIndex + 1} of ${searchResults.length}`
                                    : 'No results'
                                }
                            </span>
                        )}
                    </div>

                    {/* Navigation arrows */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            className="icon-btn"
                            onClick={() => navigateSearch('prev')}
                            disabled={searchResults.length === 0}
                            style={{ opacity: searchResults.length === 0 ? 0.4 : 1 }}
                            title="Previous result"
                        >
                            <ChevronUp size={18} />
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => navigateSearch('next')}
                            disabled={searchResults.length === 0}
                            style={{ opacity: searchResults.length === 0 ? 0.4 : 1 }}
                            title="Next result"
                        >
                            <ChevronDown size={18} />
                        </button>
                    </div>

                    <button
                        className="icon-btn"
                        onClick={closeSearch}
                        title="Close search"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: 'var(--spacing-lg)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)'
            }}>
                <div style={{ alignSelf: 'center', margin: 'var(--spacing-lg) 0' }}>
                    <span style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                    }}>
                        Today
                    </span>
                </div>

                {messages.map((msg) => {
                    const isSearchMatch = searchResults.includes(msg.id);
                    const isCurrentSearchResult = searchResults[currentSearchIndex] === msg.id;

                    return (
                        <div
                            key={msg.id}
                            ref={(el) => { messageRefs.current[msg.id] = el; }}
                            style={{
                                // Highlight search matches
                                ...(isSearchMatch && {
                                    backgroundColor: isCurrentSearchResult
                                        ? 'rgba(var(--accent-rgb, 99, 102, 241), 0.2)'
                                        : 'rgba(var(--accent-rgb, 99, 102, 241), 0.08)',
                                    borderRadius: '12px',
                                    padding: '4px',
                                    margin: '-4px',
                                    transition: 'background-color 0.3s ease'
                                })
                            }}
                        >
                            <MessageBubble
                                id={msg.id}
                                isMe={msg.sender === 'me'}
                                text={msg.text}
                                timestamp={msg.timestamp}
                                image={msg.image}
                                reactions={msg.reactions}
                                onReact={onReact}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onReply={setReplyingTo}
                                isEdited={msg.isEdited}
                                status={msg.status}
                                replyTo={msg.replyTo}
                                isHighlighted={replyingTo?.id === msg.id}
                                senderName={msg.senderName}
                                senderAvatar={msg.senderAvatar}
                            />
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                <TypingIndicator
                    userName={typingUser?.userName}
                    isVisible={!!typingUser}
                />

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: 'var(--spacing-md) var(--spacing-xl)',
                backdropFilter: 'blur(var(--backdrop-blur))',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* Reply Preview */}
                {replyingTo && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        borderLeft: '3px solid var(--accent-primary)',
                        animation: 'slideUp 0.2s ease'
                    }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--accent-primary)',
                                marginBottom: '2px'
                            }}>
                                Replying to {replyingTo.sender === 'me' ? 'yourself' : 'them'}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {replyingTo.image && (
                                    <img
                                        src={replyingTo.image}
                                        alt="reply preview"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                        }}
                                    />
                                )}
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {replyingTo.text || '📷 Photo'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Image Preview */}
                {selectedImage && (
                    <div style={{
                        position: 'relative',
                        width: 'fit-content',
                        marginLeft: '16px',
                        animation: 'slideUp 0.2s ease'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <img
                                src={selectedImage}
                                alt="Preview"
                                style={{
                                    height: '100px',
                                    maxWidth: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    opacity: isUploading ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            />
                            {isUploading && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px'
                                }}>
                                    <Loader2 size={24} color="white" className="animate-spin" />
                                </div>
                            )}
                        </div>
                        {pendingFile && (
                            <div style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                marginTop: '4px',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                <ImageIcon size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {pendingFile.name}
                            </div>
                        )}
                        {/* Always show cancel button */}
                        <button
                            onClick={() => {
                                setSelectedImage(null);
                                setPendingFile(null);
                                setIsUploading(false);
                            }}
                            title={isUploading ? "Cancel upload" : "Remove image"}
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: isUploading ? '#ef4444' : 'var(--bg-elevated)',
                                border: isUploading ? 'none' : '1px solid var(--border-color)',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isUploading ? 'white' : 'var(--text-secondary)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '8px 8px 8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <button
                        className="icon-btn"
                        style={{ padding: '6px' }}
                        title="Attach Image"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.95rem',
                            fontFamily: 'inherit',
                            fontWeight: 400
                        }}
                    />
                    <button className="icon-btn" style={{ padding: '6px' }} title="Emoji">
                        <Smile size={20} />
                    </button>
                    <button
                        onClick={handleSend}
                        title="Send Message"
                        style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Send size={18} fill="white" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
};

export default ChatWindow;
