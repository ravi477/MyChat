
import React from 'react';
import { Search, PenSquare, MessageSquare, Phone, Settings, LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Conversation } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    conversations: Conversation[];
    activeConversationId: string;
    onSelectConversation: (id: string) => void;
    isConnected?: boolean;
    onNewChat?: () => void;
    onSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    toggleSidebar,
    conversations,
    activeConversationId,
    onSelectConversation,
    isConnected = false,
    onNewChat,
    onSettings
}) => {
    const { theme, toggleTheme } = useTheme();

    const getStatusColor = (status: Conversation['status']) => {
        switch (status) {
            case 'online': return '#10b981'; // Green
            case 'busy': return '#ef4444';   // Red
            case 'away': return '#eab308';   // Yellow
            case 'offline': return '#94a3b8'; // Grey
            default: return '#94a3b8';
        }
    };

    return (
        <aside style={{
            width: isOpen ? '320px' : '88px', // Rail width
            height: '100%',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-color)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
        }}>
            {/* Header Area */}
            <div style={{
                padding: isOpen ? 'var(--spacing-lg) var(--spacing-md) var(--spacing-sm)' : 'var(--spacing-lg) 0 var(--spacing-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOpen ? 'stretch' : 'center',
                minHeight: '120px' // Fixed height for header area
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'space-between' : 'center',
                    marginBottom: 'var(--spacing-md)',
                    width: '100%',
                    padding: isOpen ? '0' : '0 12px'
                }}>
                    {isOpen && (
                        <h1 style={{
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 700,
                            letterSpacing: '-0.5px'
                        }}>
                            Messages
                            <span style={{
                                fontSize: '10px',
                                color: isConnected ? '#10b981' : '#ef4444',
                                marginLeft: '8px',
                                fontWeight: 500,
                                verticalAlign: 'middle'
                            }}>
                                {isConnected ? 'LIVE' : 'OFFLINE'}
                            </span>
                        </h1>
                    )}

                    <div style={{ display: 'flex', gap: '4px' }}>
                        {isOpen && (
                            <button
                                className="icon-btn"
                                title="New Message"
                                onClick={onNewChat}
                            >
                                <PenSquare size={20} />
                            </button>
                        )}
                        <button className="icon-btn" title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"} onClick={toggleSidebar}>
                            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>
                    </div>
                </div>

                {/* Search Bar - hidden in rail mode */}
                {isOpen ? (
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '36px' }}
                        />
                    </div>
                ) : (
                    <button className="icon-btn" title="Search">
                        <Search size={20} />
                    </button>
                )}
            </div>

            {/* Conversation List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: 'var(--spacing-xs) var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
                alignItems: isOpen ? 'stretch' : 'center'
            }}>
                {isOpen ? (
                    <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--spacing-xs)',
                        marginTop: 'var(--spacing-sm)'
                    }}>
                        Recent Chats
                    </span>
                ) : (
                    <div style={{ height: '24px' }} /> // Spacer
                )}

                {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                        <div key={conv.id}
                            className={isActive ? '' : 'chat-item'}
                            title={!isOpen ? conv.name : undefined}
                            onClick={() => onSelectConversation(conv.id)}
                            style={{
                                padding: isOpen ? 'var(--spacing-sm) var(--spacing-md)' : '12px',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-normal)',
                                backgroundColor: isActive ? 'var(--bg-target)' : 'transparent',
                                boxShadow: isActive && theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' : 'none',
                                borderLeft: isActive && isOpen ? '3px solid var(--accent-primary)' : '3px solid transparent', // Left border only when open
                                border: isActive && !isOpen ? '2px solid var(--accent-primary)' : (isActive && theme === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'), // Ring border when closed
                                borderLeftWidth: isActive && isOpen ? '3px' : (isActive && !isOpen ? '2px' : '1px'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isOpen ? 'flex-start' : 'center',
                                gap: 'var(--spacing-md)',
                                transform: isActive && isOpen ? 'translateX(4px)' : 'none',
                                width: isOpen ? 'auto' : '48px', // Fixed width for centering in rail
                                height: isOpen ? 'auto' : '48px',
                                boxSizing: 'content-box' // To handle padding without shrinking
                            }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img
                                    src={conv.avatar}
                                    alt={conv.name}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid var(--bg-primary)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '1px',
                                    right: '1px',
                                    width: '13px',
                                    height: '13px',
                                    borderRadius: '50%',
                                    backgroundColor: getStatusColor(conv.status),
                                    border: '2.5px solid var(--bg-primary)',
                                    zIndex: 10
                                }} />
                            </div>

                            {isOpen && (
                                <div style={{ flex: 1, overflow: 'hidden', opacity: isOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '2px',
                                        alignItems: 'baseline'
                                    }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                                            {conv.name}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                            10:30 AM
                                        </span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                                            fontWeight: conv.unreadCount > 0 ? 500 : 400,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '140px'
                                        }}>
                                            {conv.lastMessage}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                            <span style={{
                                                backgroundColor: 'var(--accent-primary)',
                                                color: 'white',
                                                'fontSize': '10px',
                                                fontWeight: 700,
                                                minWidth: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 'var(--radius-full)',
                                                marginLeft: '6px'
                                            }}>
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Utility Bar */}
            <div style={{
                padding: 'var(--spacing-md)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: isOpen ? 'space-around' : 'center',
                flexDirection: isOpen ? 'row' : 'column',
                gap: isOpen ? '0' : 'var(--spacing-md)',
                alignItems: 'center'
            }}>
                <button className="icon-btn" style={{ color: 'var(--accent-primary)' }} title="All Chats">
                    <MessageSquare size={20} />
                </button>
                <button
                    className="icon-btn"
                    title="Calls"
                    onClick={() => alert("Calling feature coming soon! 📞")}
                >
                    <Phone size={20} />
                </button>
                <button className="icon-btn" title="Toggle Theme" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                    className="icon-btn"
                    title="Settings"
                    onClick={onSettings}
                >
                    <Settings size={20} />
                </button>
                <div style={{
                    width: isOpen ? '1px' : '20px',
                    height: isOpen ? '20px' : '1px',
                    backgroundColor: 'var(--border-color)'
                }}></div>
                <button className="icon-btn" style={{ color: '#ef4444' }} title="Log Out">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
