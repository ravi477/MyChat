import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

interface MessageStatusProps {
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    timestamp?: string;
    isSender: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status, isSender }) => {
    // Only show status for sender's messages
    if (!isSender || !status) return null;

    const getStatusIcon = () => {
        switch (status) {
            case 'sending':
                return <Clock size={14} style={{ opacity: 0.5, color: 'var(--text-tertiary)' }} />;
            case 'sent':
                return <Check size={14} style={{ opacity: 0.6, color: 'var(--text-tertiary)' }} />;
            case 'delivered':
                return <CheckCheck size={14} style={{ opacity: 0.7, color: 'var(--text-tertiary)' }} />;
            case 'read':
                return <CheckCheck size={14} style={{ color: '#60a5fa' }} />; // Softer blue
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'sending':
                return 'Sending...';
            case 'sent':
                return 'Sent';
            case 'delivered':
                return 'Delivered';
            case 'read':
                return 'Read';
            default:
                return '';
        }
    };

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: '4px',
                transition: 'all 0.3s ease'
            }}
            title={getStatusText()}
        >
            {getStatusIcon()}
        </div>
    );
};

export default MessageStatus;
