
import React from 'react';

interface MessageBubbleProps {
    text: string;
    isMe: boolean;
    timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, isMe, timestamp }) => {
    return (
        <div className="animate-slide-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
            marginBottom: 'var(--spacing-sm)',
            maxWidth: '75%',
            alignSelf: isMe ? 'flex-end' : 'flex-start',
        }}>
            <div style={{
                padding: '10px 18px',
                borderRadius: '20px',
                borderBottomRightRadius: isMe ? '4px' : '20px',
                borderBottomLeftRadius: isMe ? '20px' : '4px',
                backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.6,
                wordBreak: 'break-word',
                border: !isMe ? '1px solid var(--border-color)' : 'none'
            }}>
                {text}
            </div>
            <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                marginTop: '4px',
                marginLeft: isMe ? 0 : '8px',
                marginRight: isMe ? '8px' : 0,
                fontWeight: 500
            }}>
                {timestamp}
            </span>
        </div>
    );
};

export default MessageBubble;
