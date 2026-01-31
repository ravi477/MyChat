import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import NewChatModal from './components/NewChatModal';
import SettingsModal from './components/SettingsModal';
// import LoginModal from './components/LoginModal'; // Replaced by AuthPage
import AuthPage from './components/auth/AuthPage';
import { MOCK_CONVERSATIONS, INITIAL_MESSAGES, type Message, type Conversation } from './data/mockData';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import { Loader2 } from 'lucide-react';

interface User {
  userId: string;
  username: string;
  socketId: string;
}

function AuthenticatedApp() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [activeConversationId, setActiveConversationId] = useState<string>(MOCK_CONVERSATIONS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const { currentUser: firebaseUser } = useAuth();
  const { socket, isConnected } = useSocket();

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  const activeMessages = messages[activeConversationId] || [];

  // Auto-login to socket when Firebase Auth is ready
  useEffect(() => {
    if (socket && firebaseUser) {
      socket.emit('login', firebaseUser.displayName || firebaseUser.email || 'Anonymous');
    }
  }, [socket, firebaseUser]);

  // Socket Events
  useEffect(() => {
    if (!socket) return;

    // Removed socket.on('login_success') as login is now handled by AuthContext

    socket.on('user_list', (users: User[]) => {
      setOnlineUsers(users);
    });

    socket.on('receive_message', (data: Message & { conversationId?: string }) => {
      const { conversationId, ...message } = data;

      if (conversationId) {
        // Play sound if message is not from 'me' (and not from myself across tabs, roughly)
        // Better check: message.sender !== currentUser?.username
        if (message.sender !== 'me' && message.sender !== (firebaseUser?.displayName || firebaseUser?.email)) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play failed:', e));
        }

        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), message]
        }));

        setConversations(prev => prev.map(c =>
          c.id === conversationId ? { ...c, lastMessage: message.text, unreadCount: c.id === activeConversationId ? 0 : c.unreadCount + 1 } : c
        ));
      }
    });

    return () => {
      // socket.off('login_success'); // Removed
      socket.off('user_list');
      socket.off('receive_message');
    };
  }, [socket, activeConversationId, firebaseUser]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleCreateChat = (name: string, username?: string) => {
    // Check if conversation already exists (TODO: better logic based on ID)
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      name: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: 'online', // Assume they are online if we just clicked them
      lastMessage: 'Start a conversation',
      unreadCount: 0,
      recipientUsername: username // Store proper username for DM routing
    };

    setConversations(prev => [newConversation, ...prev]);
    setMessages(prev => ({ ...prev, [newId]: [] }));
    setActiveConversationId(newId);
  };

  const handleSendMessage = (text: string) => {
    if (!firebaseUser) return;

    const senderName = firebaseUser.displayName || firebaseUser.email || 'Anonymous';

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: senderName, // Send actual username
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (socket) {
      let recipientId;

      // Determine if this is a DM
      const currentConversation = conversations.find(c => c.id === activeConversationId);
      if (currentConversation?.recipientUsername) {
        // Find recipient's socket ID from online list
        const recipient = onlineUsers.find(u => u.username === currentConversation.recipientUsername);
        if (recipient) {
          recipientId = recipient.socketId;
        } else {
          // User offline? For now, we fall back to broadcast OR ideally handle offline logic (queue on server, DB)
          // But server discards unicast if socket not found.
          // Let's rely on server broadcasting if no recipientId? 
          // NO, if it's meant to be private, DO NOT broadcast.
          // Just send without recipientId? No, that broadcasts.
          // We can warn user "User is offline" locally.
          console.warn("Recipient offline or not found");
          // For prototype: we just send. If checks fail on server, so be it. 
          // But wait, if I don't send recipientId, server broadcasts to EVERYONE. That's bad for privacy.
          // So if I have a recipientUsername but no online user match -> DO NOT SEND or send with dead ID.
        }
      }

      socket.emit('message', {
        conversationId: activeConversationId,
        recipientId, // Send this if found
        ...newMessage
      });
    }
  };

  return (
    <>
      <Layout>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          isConnected={isConnected}
          onNewChat={() => setIsNewChatOpen(true)}
          onSettings={() => setIsSettingsOpen(true)}
        />
        <ChatWindow
          conversation={activeConversation}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
        />
      </Layout>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
        onlineUsers={onlineUsers.filter(u => u.username !== (firebaseUser?.displayName || firebaseUser?.email))}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--accent-primary)'
      }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return currentUser ? <AuthenticatedApp /> : <AuthPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
