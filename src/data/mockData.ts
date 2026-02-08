
export interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    createdAt?: number; // timestamp for logic
    image?: string;
    reactions?: Record<string, number>; // emoji -> count
    userReactions?: Record<string, string>; // userId -> emoji
    isEdited?: boolean;
    // Message status tracking
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    senderName?: string;
    senderAvatar?: string;
    deliveredAt?: number;
    readAt?: number;
    // Reply threading
    replyTo?: {
        id: string;
        text: string;
        sender: string;
        image?: string;
    };
}

export interface Conversation {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    unreadCount: number;
    recipientUsername?: string; // For DM routing
    status: 'online' | 'busy' | 'away' | 'offline'; // Updated status types
    // Group chat properties
    isGroup?: boolean;
    members?: string[]; // Array of user IDs
    memberNames?: Record<string, string>; // userId -> display name
    admins?: string[]; // Array of admin user IDs
    createdBy?: string; // User ID of creator
    createdAt?: number; // Timestamp
}

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        name: 'Elara Vane',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
        lastMessage: 'The new design looks absolutely stunning! 🎨',
        unreadCount: 2,
        status: 'online'
    },
    {
        id: '2',
        name: 'Julian Reed',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150',
        lastMessage: 'Can we reschedule the meeting to Tuesday?',
        unreadCount: 0,
        status: 'busy' // Changed to busy (Red)
    },
    {
        id: '3',
        name: 'Sophie Clark',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150',
        lastMessage: 'Thanks for the update!',
        unreadCount: 5,
        status: 'away' // Changed to away (Yellow)
    },
    {
        id: '4',
        name: 'Liam Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
        lastMessage: 'I sent over the files you asked for.',
        unreadCount: 1,
        status: 'offline' // Changed to offline (Grey)
    },
    {
        id: '5',
        name: 'Ava Wright',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150',
        lastMessage: 'Lunch at 1?',
        unreadCount: 0,
        status: 'online'
    }
];

// Initial messages mapped by Conversation ID
export const INITIAL_MESSAGES: Record<string, Message[]> = {
    '1': [
        { id: '1', text: 'Hey! I just saw the latest mockup. 🤩', sender: 'other', timestamp: '10:00 AM' },
        { id: '2', text: ' Glad you liked it! Any feedback?', sender: 'me', timestamp: '10:05 AM' },
        { id: '3', text: 'The gradients are perfect. Maybe tweak the shadow?', sender: 'other', timestamp: '10:10 AM' },
        { id: '4', text: 'The new design looks absolutely stunning! 🎨', sender: 'other', timestamp: '10:30 AM' }
    ],
    '2': [
        { id: '1', text: 'Hey Julian, are we still on for today?', sender: 'me', timestamp: '9:00 AM' },
        { id: '2', text: 'I might need to push it back.', sender: 'other', timestamp: '9:15 AM' },
        { id: '3', text: 'Can we reschedule the meeting to Tuesday?', sender: 'other', timestamp: '9:16 AM' }
    ],
    '3': [
        { id: '1', text: 'Sophie, did you get the report?', sender: 'me', timestamp: 'Yesterday' },
        { id: '2', text: 'Yes, reviewing it now.', sender: 'other', timestamp: 'Yesterday' },
        { id: '3', text: 'Thanks for the update!', sender: 'other', timestamp: 'Yesterday' }
    ],
    '4': [
        { id: '1', text: 'Liam, do you have the assets?', sender: 'me', timestamp: '2 days ago' },
        { id: '2', text: 'Uploading them now.', sender: 'other', timestamp: '2 days ago' },
        { id: '3', text: 'I sent over the files you asked for.', sender: 'other', timestamp: '2 days ago' }
    ],
    '5': [
        { id: '1', text: 'Lunch at 1?', sender: 'other', timestamp: '11:00 AM' }
    ]
};
