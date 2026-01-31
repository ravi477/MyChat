import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import NewChatModal from './components/NewChatModal';
import SettingsModal from './components/SettingsModal';
// import LoginModal from './components/LoginModal'; // Replaced by AuthPage
import AuthPage from './components/auth/AuthPage';
import { type Message, type Conversation } from './data/mockData';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSocket } from './hooks/useSocket';
import { Loader2 } from 'lucide-react';



function AuthenticatedApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { currentUser: firebaseUser } = useAuth();
  const { isConnected, login, sendMessage, receivedMessage } = useSocket();

  // Firestore: Fetch Users
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(collection(db, 'users'), where('uid', '!=', firebaseUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        avatar: doc.data().avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name)}`,
        status: doc.data().status || 'offline',
        lastMessage: 'Say hi!',
        unreadCount: 0,
        recipientId: doc.id // Add this for routing
      } as Conversation));

      setConversations(usersList);
      if (!activeConversationId && usersList.length > 0) {
        setActiveConversationId(usersList[0].id);
      }
    });

    return unsubscribe;
  }, [firebaseUser, activeConversationId]);

  // Socket: Sync with Auth
  useEffect(() => {
    if (firebaseUser?.uid) {
      login(firebaseUser.uid);
    }
  }, [firebaseUser, login]);

  // Socket: Handle incoming messages
  useEffect(() => {
    if (receivedMessage) {
      const { senderId, text, timestamp } = receivedMessage;

      // Determine which "conversation" this belongs to
      // If it's from me, it goes to the active recipient
      // If it's to me, it goes to the sender's conversation
      const conversationId = senderId === firebaseUser?.uid ? receivedMessage.recipientId : senderId;

      if (conversationId) {
        // Play notification if not active or not from me
        if (senderId !== firebaseUser?.uid && conversationId !== activeConversationId) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play failed:', e));
        }

        const newMessage: Message = {
          id: Date.now().toString() + Math.random(),
          text,
          sender: senderId === firebaseUser?.uid ? 'me' : 'other',
          timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage]
        }));
      }
    }
  }, [receivedMessage, firebaseUser]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeMessages = messages[activeConversationId] || [];

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
    if (!firebaseUser || !activeConversationId) return;

    const payload = {
      text,
      senderId: firebaseUser.uid,
      recipientId: activeConversationId, // Each user is their own conversation ID
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    sendMessage(payload);
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
          conversation={activeConversation || { id: 'empty', name: 'Select a chat', avatar: '', status: 'offline', lastMessage: '', unreadCount: 0 }}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
        />
      </Layout>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
        onlineUsers={[]} // Placeholder for now or removed
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
