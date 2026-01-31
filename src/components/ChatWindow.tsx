
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import MessageBubble from './MessageBubble';
import type { Conversation, Message } from '../data/mockData';

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, messages, onSendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getStatusColor = (status: Conversation['status']) => {
        switch (status) {
            case 'online': return '#10b981';
            case 'busy': return '#ef4444';
            case 'away': return '#eab308';
            case 'offline': return '#94a3b8';
            default: return '#94a3b8';
        }
    };

    const getStatusText = (status: Conversation['status']) => {
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
                // backgroundColor: 'rgba(15, 23, 42, 0.4)',
                height: '72px'
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
                    <button className="icon-btn" title="Voice Call">
                        <Phone size={20} />
                    </button>
                    <button className="icon-btn" title="Video Call">
                        <Video size={20} />
                    </button>
                    <button className="icon-btn" title="More Options">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

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

                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        isMe={msg.sender === 'me'}
                        text={msg.text}
                        timestamp={msg.timestamp}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderTop: '1px solid var(--border-color)',
                backdropFilter: 'blur(var(--backdrop-blur))'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '8px 8px 8px 16px',
                    borderRadius: '24px', // Pill shape
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease'
                }}>
                    <button className="icon-btn" style={{ padding: '4px' }} title="Attach File">
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: 'var(--font-size-sm)',
                            fontFamily: 'inherit'
                        }}
                    />
                    <button className="icon-btn" style={{ padding: '4px' }} title="Emoji">
                        <Smile size={20} />
                    </button>
                    <button
                        onClick={handleSend}
                        title="Send Message"
                        style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ChatWindow;
