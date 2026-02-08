
import React from 'react';
import {
    Search, PenSquare, MessageSquare, Phone, Settings, LogOut,
    Sun, Moon, PanelLeftClose, PanelLeftOpen, Users, MoreHorizontal,
    Mail, Bell, User, Video, Ban, Archive, Trash2, AlertOctagon
} from 'lucide-react';
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
    onCreateGroup?: () => void;
    onSettings?: () => void;
    onLogout?: () => void;
    onArchive?: (id: string) => void;
    onBlock?: (id: string) => void;
    onDelete?: (id: string) => void;
    onCall?: (id: string, video: boolean) => void;
    onMute?: (id: string) => void;
    onMarkUnread?: (id: string) => void;
    onViewProfile?: (id: string) => void;
    onReport?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    toggleSidebar,
    conversations,
    activeConversationId,
    onSelectConversation,
    isConnected = false,
    onNewChat,
    onCreateGroup,
    onSettings,
    onLogout,
    onArchive,
    onBlock,
    onDelete,
    onCall,
    onMute,
    onMarkUnread,
    onViewProfile,
    onReport
}) => {
    const { mode, toggleMode } = useTheme();
    const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
    const [hoveredId, setHoveredId] = React.useState<string | null>(null);

    // Close menu on click outside
    React.useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        if (menuOpenId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [menuOpenId]);

    const handleMenuClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    const handleAction = (e: React.MouseEvent, action: string, conversationId: string) => {
        e.stopPropagation();
        console.log(`Action: ${action} for conversation ${conversationId}`);

        switch (action) {
            case 'Archive':
                onArchive?.(conversationId);
                break;
            case 'Block':
                onBlock?.(conversationId);
                break;
            case 'Delete':
                onDelete?.(conversationId);
                break;
            case 'Audio call':
                onCall?.(conversationId, false);
                break;
            case 'Video call':
                onCall?.(conversationId, true);
                break;
            case 'Mute':
                onMute?.(conversationId);
                break;
            case 'Mark as unread':
                onMarkUnread?.(conversationId);
                break;
            case 'View profile':
                onViewProfile?.(conversationId);
                break;
            case 'Report':
                onReport?.(conversationId);
                break;
            default:
                console.log(`${action} triggered for this chat`);
            // For other actions, we can add more handlers later
        }

        setMenuOpenId(null);
    };

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
            width: isOpen ? '320px' : '88px',
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
                minHeight: '120px'
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
                            FriendsChat
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
                            <>
                                <button className="icon-btn" title="New Message" onClick={onNewChat}><PenSquare size={20} /></button>
                                <button className="icon-btn" title="Create Group" onClick={onCreateGroup} style={{ color: 'var(--accent-secondary, #8b5cf6)' }}><Users size={20} /></button>
                            </>
                        )}
                        <button className="icon-btn" title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"} onClick={toggleSidebar}>
                            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>
                    </div>
                </div>

                {isOpen ? (
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input type="text" placeholder="Search..." className="input-field" style={{ width: '100%', paddingLeft: '36px' }} />
                    </div>
                ) : (
                    <button className="icon-btn" title="Search"><Search size={20} /></button>
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
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                        Recent Chats
                    </span>
                ) : (
                    <div style={{ height: '24px' }} />
                )}

                {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                        <div key={conv.id}
                            className={isActive ? '' : 'chat-item'}
                            onClick={() => onSelectConversation(conv.id)}
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                padding: isOpen ? '10px 14px' : '10px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-out',
                                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isOpen ? 'flex-start' : 'center',
                                gap: '12px',
                                width: isOpen ? 'auto' : '48px',
                                height: isOpen ? 'auto' : '48px',
                                margin: isOpen ? '0 8px' : '0 auto',
                                position: 'relative'
                            }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img src={conv.avatar} alt={conv.name} style={{ width: '42px', height: '42px', borderRadius: conv.isGroup ? '12px' : '50%', objectFit: 'cover', border: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid var(--bg-tertiary)' }} />
                                {!conv.isGroup && <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: getStatusColor(conv.status), border: '2px solid var(--bg-primary)', zIndex: 10 }} />}
                                {conv.isGroup && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--accent-secondary, #8b5cf6)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><Users size={10} color="white" /></div>}
                            </div>

                            {isOpen && (
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'baseline' }}>
                                        <span style={{ fontWeight: 600, color: isActive ? '#fff' : 'var(--text-primary)', fontSize: '0.9rem' }}>{conv.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}>10:30 AM</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{conv.lastMessage}</span>
                                        {conv.unreadCount > 0 && (
                                            <span style={{ backgroundColor: isActive ? '#fff' : 'var(--accent-primary)', color: isActive ? 'var(--accent-primary)' : 'white', fontSize: '10px', fontWeight: 800, minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginLeft: '6px' }}>{conv.unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(hoveredId === conv.id || menuOpenId === conv.id) && (
                                <button
                                    className="icon-btn"
                                    style={{
                                        position: 'absolute',
                                        right: isOpen ? '12px' : '4px',
                                        top: isOpen ? '14px' : '4px',
                                        padding: '4px',
                                        color: isActive ? '#fff' : 'var(--text-primary)',
                                        background: menuOpenId === conv.id ? 'var(--bg-tertiary)' : 'rgba(40, 53, 72, 0.8)',
                                        borderRadius: '50%',
                                        zIndex: 20
                                    }}
                                    onClick={(e) => handleMenuClick(e, conv.id)}
                                >
                                    <MoreHorizontal size={isOpen ? 16 : 14} />
                                </button>
                            )}

                            {menuOpenId === conv.id && (
                                <div className="dropdown-menu" style={{ top: isOpen ? '40px' : '48px', right: isOpen ? '12px' : '-240px', position: 'absolute', zIndex: 1000 }} onClick={(e) => e.stopPropagation()}>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Mark as unread', conv.id)}><div className="dropdown-item-icon"><Mail size={16} /></div>Mark as unread</button>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Mute', conv.id)}><div className="dropdown-item-icon"><Bell size={16} /></div>Mute notifications</button>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'View profile', conv.id)}><div className="dropdown-item-icon"><User size={16} /></div>View profile</button>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Audio call', conv.id)}><div className="dropdown-item-icon"><Phone size={16} /></div>Audio call</button>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Video call', conv.id)}><div className="dropdown-item-icon"><Video size={16} /></div>Video chat</button>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Block', conv.id)}><div className="dropdown-item-icon"><Ban size={16} /></div>Block</button>
                                    <button className="dropdown-item" onClick={(e) => handleAction(e, 'Archive', conv.id)}><div className="dropdown-item-icon"><Archive size={16} /></div>Archive chat</button>
                                    <button className="dropdown-item danger" onClick={(e) => handleAction(e, 'Delete', conv.id)}><div className="dropdown-item-icon" style={{ color: '#ef4444' }}><Trash2 size={16} /></div>Delete Chat</button>
                                    <button className="dropdown-item danger" onClick={(e) => handleAction(e, 'Report', conv.id)}><div className="dropdown-item-icon" style={{ color: '#ef4444' }}><AlertOctagon size={16} /></div>Report</button>
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
                <button className="icon-btn" style={{ color: 'var(--accent-primary)' }} title="All Chats" onClick={() => onSelectConversation('empty')}><MessageSquare size={20} /></button>
                <button className="icon-btn" title="Calls" onClick={() => alert("Recent calls feature coming soon! 📞")}><Phone size={20} /></button>
                <button className="icon-btn" title="Toggle Theme" onClick={toggleMode}>{mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
                <button className="icon-btn" title="Settings" onClick={onSettings}><Settings size={20} /></button>
                <div style={{ width: isOpen ? '1px' : '20px', height: isOpen ? '20px' : '1px', backgroundColor: 'var(--border-color)' }}></div>
                <button className="icon-btn" style={{ color: '#ef4444' }} title="Log Out" onClick={() => onLogout?.()}><LogOut size={20} /></button>
            </div>
        </aside>
    );
};

export default Sidebar;
