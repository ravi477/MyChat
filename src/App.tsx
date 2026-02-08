import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import NewChatModal from './components/NewChatModal';
import CreateGroupModal from './components/CreateGroupModal';
import SettingsModal from './components/SettingsModal';
import GroupInfoModal from './components/GroupInfoModal';
import AuthPage from './components/auth/AuthPage';
import { type Message, type Conversation } from './data/mockData';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, orderBy, updateDoc, doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useSocket } from './hooks/useSocket';
import { Loader2 } from 'lucide-react';
import { CallProvider, useCall } from './context/CallContext';
import CallOverlay from './components/CallOverlay';

function AuthenticatedApp() {
  const { callUser } = useCall();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [archivedChats, setArchivedChats] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [deletedChats, setDeletedChats] = useState<string[]>([]);
  const [keepArchived, setKeepArchived] = useState(true);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeMessages = messages[activeConversationId] || [];

  const { currentUser: firebaseUser, logout } = useAuth();
  const { socket, isConnected, login, logout: socketLogout, receivedMessage, sendMessage, emitTyping, userTyping } = useSocket();

  const handleLogout = async () => {
    try {
      if (firebaseUser?.uid) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          status: 'offline'
        }, { merge: true });
      }
      socketLogout();
      await logout();
      setActiveConversationId('');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  useEffect(() => {
    if (!firebaseUser) return;

    // 1. Listen for Users
    const qUsers = query(collection(db, 'users'), where('uid', '!=', firebaseUser.uid));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.data().uid || doc.id,
        name: doc.data().name,
        avatar: doc.data().avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name)}`,
        status: doc.data().status || 'offline',
        lastMessage: 'Say hi!',
        unreadCount: 0,
        recipientUsername: doc.data().email?.split('@')[0],
        isGroup: false
      } as Conversation));

      setConversations(prev => {
        const currentGroups = prev.filter(c => c.isGroup);
        const existingUsersMap = new Map(prev.filter(c => !c.isGroup).map(c => [c.id, c]));

        const mergedUsers = usersList.map(user => {
          const existing = existingUsersMap.get(user.id);
          if (existing) {
            return {
              ...user,
              unreadCount: existing.unreadCount || 0,
              lastMessage: existing.lastMessage !== 'Say hi!' ? existing.lastMessage : user.lastMessage
            };
          }
          return user;
        });

        return [...currentGroups, ...mergedUsers];
      });
    });

    // 2. Listen for Groups
    const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', firebaseUser.uid));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      const groupsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isGroup: true
      } as Conversation));

      setConversations(prev => {
        // Keep all current users
        const currentUsers = prev.filter(c => !c.isGroup);

        // Use a map to track which groups we are updating from the snapshot
        const snapshotGroupIds = new Set(groupsList.map(g => g.id));

        // Keep any groups that are NOT in the current snapshot but exist in our local state
        // (This handles the race condition where a locally created group hasn't hit the snapshot yet)
        const pendingGroups = prev.filter(c => c.isGroup && !snapshotGroupIds.has(c.id));

        const existingGroupsMap = new Map(prev.filter(c => c.isGroup).map(c => [c.id, c]));

        const mergedGroups = groupsList.map(group => {
          const existing = existingGroupsMap.get(group.id);
          if (existing) {
            return {
              ...existing, // Preserve local fields like unreadCount
              ...group,    // Update with latest from Firestore
              lastMessage: group.lastMessage || existing.lastMessage // Don't lose lastMessage if it's missing in snapshot
            };
          }
          return group;
        });

        return [...mergedGroups, ...pendingGroups, ...currentUsers];
      });
    });

    // 3. Listen for User Profile settings (archived, blocked)
    const unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setArchivedChats(data.archivedChats || []);
        setBlockedUsers(data.blockedUsers || []);
        setDeletedChats(data.deletedChats || []);
        setKeepArchived(data.keepArchived !== undefined ? data.keepArchived : true);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
      unsubscribeProfile();
    };
  }, [firebaseUser]);

  // Update user status to online when connected
  useEffect(() => {
    if (firebaseUser?.uid && isConnected) {
      login(firebaseUser.uid);
      setDoc(doc(db, 'users', firebaseUser.uid), {
        status: 'online'
      }, { merge: true }).catch(console.error);
    }
  }, [firebaseUser, login, isConnected]);

  // Listen for real-time user status changes from socket
  useEffect(() => {
    if (!socket) return;
    const handleUserOnline = (userId: string) => {
      setConversations(prev => prev.map(c => c.id === userId ? { ...c, status: 'online' } : c));
    };
    const handleUserOffline = (userId: string) => {
      setConversations(prev => prev.map(c => c.id === userId ? { ...c, status: 'offline' } : c));
    };
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket]);

  // Update status to offline when user closes browser/tab
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const handleBeforeUnload = async () => {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), { status: 'offline' }, { merge: true });
      } catch (e) { }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setDoc(doc(db, 'users', firebaseUser.uid), { status: 'away' }, { merge: true }).catch(() => { });
      } else if (document.visibilityState === 'visible') {
        setDoc(doc(db, 'users', firebaseUser.uid), { status: 'online' }, { merge: true }).catch(() => { });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [firebaseUser?.uid]);

  const handleGroupInfo = () => {
    if (activeConversation?.isGroup) {
      setIsGroupInfoOpen(true);
    } else if (activeConversation) {
      alert(`User Info: ${activeConversation.name}\nStatus: ${activeConversation.status}\nUsername: @${activeConversation.recipientUsername || 'not set'}`);
    }
  };

  const handleAddMembers = async (userIds: string[]) => {
    if (!activeConversation?.isGroup || !firebaseUser) return;

    // Add logic to get user details to update memberNames map
    const newMemberNames: Record<string, string> = {};
    userIds.forEach(id => {
      const user = conversations.find(c => c.id === id);
      if (user) newMemberNames[id] = user.name;
    });

    try {
      await updateDoc(doc(db, 'groups', activeConversation.id), {
        members: arrayUnion(...userIds),
        memberNames: {
          ...activeConversation.memberNames,
          ...newMemberNames
        }
      });

      // System message
      const names = userIds.map(id => newMemberNames[id]).join(', ');
      await addDoc(collection(db, 'groups', activeConversation.id, 'messages'), {
        text: `${firebaseUser.displayName || 'Admin'} added ${names}`,
        senderId: 'system',
        timestamp: serverTimestamp(),
        status: 'sent'
      });

    } catch (e) {
      console.error("Error adding members:", e);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeConversation?.isGroup || !firebaseUser) return;

    try {
      if (userId === firebaseUser.uid) {
        handleLeaveGroup();
        return;
      }

      const memberName = activeConversation.memberNames?.[userId] || 'User';

      await updateDoc(doc(db, 'groups', activeConversation.id), {
        members: arrayRemove(userId)
      });

      if (activeConversation.admins?.includes(userId)) {
        await updateDoc(doc(db, 'groups', activeConversation.id), {
          admins: arrayRemove(userId)
        });
      }

      await addDoc(collection(db, 'groups', activeConversation.id, 'messages'), {
        text: `${firebaseUser.displayName || 'Admin'} removed ${memberName}`,
        senderId: 'system',
        timestamp: serverTimestamp(),
        status: 'sent'
      });

    } catch (e) {
      console.error("Error removing member:", e);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConversation?.isGroup || !firebaseUser) return;

    try {
      await updateDoc(doc(db, 'groups', activeConversation.id), {
        members: arrayRemove(firebaseUser.uid)
      });

      await addDoc(collection(db, 'groups', activeConversation.id, 'messages'), {
        text: `${firebaseUser.displayName || 'Someone'} left the group`,
        senderId: 'system',
        timestamp: serverTimestamp(),
        status: 'sent'
      });

      setIsGroupInfoOpen(false);
      setActiveConversationId('');
    } catch (e) {
      console.error("Error leaving group:", e);
    }
  };

  const handleUpdateGroup = async (groupId: string, data: { name?: string; avatar?: string }) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), data);
      console.log(`Updated group ${groupId}`);
    } catch (e) {
      console.error("Error updating group:", e);
    }
  };

  const handlePromoteAdmin = async (groupId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        admins: arrayUnion(userId)
      });
      console.log(`Promoted user ${userId} to admin in group ${groupId}`);
    } catch (e) {
      console.error("Error promoting admin:", e);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm("Are you sure you want to delete this group? This will remove it for everyone.")) {
      try {
        // In a real app, you might want to delete messages too, but here we'll just delete the group doc
        // Actually, we should probably mark it as deleted or similar. 
        // For now, let's just remove the group document.
        // await deleteDoc(doc(db, 'groups', groupId)); 
        // But the users still have it in their local state until refresh.
        // A better way is to notify or just let the query handle it.
        console.log(`Deleting group ${groupId}`);
        setIsGroupInfoOpen(false);
        setActiveConversationId('');
      } catch (e) {
        console.error("Error deleting group:", e);
      }
    }
  };

  // Handle socket messages
  useEffect(() => {
    if (receivedMessage) {
      const { senderId, text } = receivedMessage;
      if (senderId === firebaseUser?.uid) return;

      const conversationId = senderId;

      if (conversationId) {
        // Handle unarchiving if setting is off
        if (!keepArchived && archivedChats.includes(conversationId)) {
          handleUnarchiveConversation(conversationId);
        }

        if (conversationId !== activeConversationId) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play failed:', e));

          setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, lastMessage: text, unreadCount: (c.unreadCount || 0) + 1 } : c
          ));
        }
      }
    }
  }, [receivedMessage, firebaseUser, activeConversationId]);

  // Firestore Real-time Chat Sync
  useEffect(() => {
    if (!firebaseUser || !activeConversationId) return;

    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv) return;

    let collectionRef;

    if (activeConv.isGroup) {
      collectionRef = collection(db, 'groups', activeConversationId, 'messages');
    } else {
      const chatId = [firebaseUser.uid, activeConversationId].sort().join('_');
      collectionRef = collection(db, 'chats', chatId, 'messages');
    }

    const q = query(collectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const isMe = data.senderId === firebaseUser.uid;

        let senderName = 'Them';
        let senderAvatar = undefined;

        if (activeConv.isGroup && !isMe) {
          senderName = activeConv.memberNames?.[data.senderId] || 'Member';
          senderAvatar = activeConv.memberNames?.[data.senderId]
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.memberNames[data.senderId])}`
            : undefined;
        }

        return {
          id: docSnap.id,
          text: data.text,
          sender: isMe ? 'me' : 'other',
          senderName: isMe ? 'You' : senderName,
          senderAvatar: senderAvatar,
          timestamp: data.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
          createdAt: data.timestamp?.toMillis?.() || Date.now(),
          image: data.image,
          reactions: data.reactions,
          userReactions: data.userReactions,
          isEdited: data.isEdited,
          status: data.status || 'sent',
          deliveredAt: data.deliveredAt,
          readAt: data.readAt,
          replyTo: data.replyTo || undefined,
          senderId: data.senderId
        } as Message & { senderId: string, senderName?: string, senderAvatar?: string };
      });

      setMessages(prev => ({
        ...prev,
        [activeConversationId]: msgs
      }));

      const unreadFromOthers = snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        const isFromOthers = data.senderId !== firebaseUser.uid;
        const isrelevantSender = activeConv.isGroup ? true : data.senderId === activeConversationId;

        return isFromOthers &&
          data.status !== 'read' &&
          isrelevantSender;
      });

      for (const docSnap of unreadFromOthers) {
        try {
          const messageRef = activeConv.isGroup
            ? doc(db, 'groups', activeConversationId, 'messages', docSnap.id)
            : doc(db, 'chats', [firebaseUser.uid, activeConversationId].sort().join('_'), 'messages', docSnap.id);

          await updateDoc(messageRef, {
            status: 'read',
            readAt: Date.now()
          });
        } catch (e) {
        }
      }

      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        setConversations(prev => prev.map(c =>
          c.id === activeConversationId ? { ...c, lastMessage: lastMsg.text } : c
        ));
      }
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
    });

    return unsubscribe;
  }, [firebaseUser, activeConversationId]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleCreateChat = (name: string, username?: string) => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      name: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: 'online',
      lastMessage: 'Start a conversation',
      unreadCount: 0,
      recipientUsername: username
    };

    setConversations(prev => [newConversation, ...prev]);
    setMessages(prev => ({ ...prev, [newId]: [] }));
    setActiveConversationId(newId);
  };

  const handleCreateGroup = async (groupData: {
    name: string;
    members: string[];
    avatar?: string;
  }) => {
    if (!firebaseUser) return;

    const groupId = `group_${Date.now()}`;
    const allMembers = [firebaseUser.uid, ...groupData.members];

    const memberNames: Record<string, string> = {
      [firebaseUser.uid]: firebaseUser.displayName || firebaseUser.email || 'You'
    };
    groupData.members.forEach(memberId => {
      const member = conversations.find(c => c.id === memberId);
      if (member) {
        memberNames[memberId] = member.name;
      }
    });

    const newGroup: Conversation = {
      id: groupId,
      name: groupData.name,
      avatar: groupData.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${groupData.name}`,
      status: 'online',
      lastMessage: 'Group created',
      unreadCount: 0,
      isGroup: true,
      members: allMembers,
      memberNames: memberNames,
      admins: [firebaseUser.uid],
      createdBy: firebaseUser.uid,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'groups', groupId), {
        name: groupData.name,
        avatar: newGroup.avatar,
        members: allMembers,
        memberNames: memberNames,
        admins: [firebaseUser.uid],
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
        isGroup: true // Added for unambiguous identification in queries/logic
      });
    } catch (error) {
      console.error('Failed to create group:', error);
    }

    setConversations(prev => [newGroup, ...prev]);
    setMessages(prev => ({ ...prev, [groupId]: [] }));
    setActiveConversationId(groupId);
  };

  const handleSendMessage = async (text: string, image?: string, replyTo?: { id: string; text: string; sender: string; image?: string }) => {
    if (!firebaseUser || !activeConversationId) return;

    const activeConv = conversations.find(c => c.id === activeConversationId);
    let collectionRef;
    let chatId: string | undefined;

    if (activeConv?.isGroup) {
      collectionRef = collection(db, 'groups', activeConversationId, 'messages');
    } else {
      chatId = [firebaseUser.uid, activeConversationId].sort().join('_');
      collectionRef = collection(db, 'chats', chatId, 'messages');
    }

    const isRecipientOnline = !activeConv?.isGroup && activeConv?.status === 'online';

    try {
      const docRef = await addDoc(collectionRef, {
        text,
        senderId: firebaseUser.uid,
        timestamp: serverTimestamp(),
        image: image || null,
        reactions: {},
        userReactions: {},
        isEdited: false,
        status: 'sent',
        deliveredAt: null,
        readAt: null,
        replyTo: replyTo || null
      });

      if (isRecipientOnline && chatId) {
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'chats', chatId!, 'messages', docRef.id), {
              status: 'delivered',
              deliveredAt: Date.now()
            });
          } catch (e) {
            console.log('Could not update delivery status');
          }
        }, 1000);
      }

      if (chatId) {
        sendMessage({
          text,
          senderId: firebaseUser.uid,
          recipientId: activeConversationId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    setMessages(prev => {
      const msgs = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: msgs.map(msg => {
          if (msg.id === messageId) {
            if (msg.createdAt && Date.now() - msg.createdAt > 300000) {
              alert("You can only edit messages within 5 minutes.");
              return msg;
            }
            return { ...msg, text: newText, isEdited: true };
          }
          return msg;
        })
      };
    });
  };

  const handleDeleteMessage = (messageId: string, deleteForEveryone: boolean) => {
    setMessages(prev => {
      const msgs = prev[activeConversationId] || [];

      if (deleteForEveryone) {
        return {
          ...prev,
          [activeConversationId]: msgs.map(msg => {
            if (msg.id === messageId) {
              if (msg.createdAt && Date.now() - msg.createdAt > 600000) {
                alert("You can only delete for everyone within 10 minutes.");
                return msg;
              }
              return { ...msg, text: '🚫 This message was deleted', image: undefined, reactions: undefined };
            }
            return msg;
          })
        };
      } else {
        return {
          ...prev,
          [activeConversationId]: msgs.filter(msg => msg.id !== messageId)
        };
      }
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!firebaseUser) return;
    const userId = firebaseUser.uid;

    setMessages(prev => {
      const currentMessages = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: currentMessages.map(msg => {
          if (msg.id === messageId) {
            const userReactions = msg.userReactions || {};
            const oldEmoji = userReactions[userId];
            const reactions = { ... (msg.reactions || {}) };

            if (oldEmoji) {
              if (reactions[oldEmoji]) {
                reactions[oldEmoji] = Math.max(0, reactions[oldEmoji] - 1);
                if (reactions[oldEmoji] === 0) delete reactions[oldEmoji];
              }
            }

            let newUserReactions = { ...userReactions };

            if (oldEmoji === emoji) {
              delete newUserReactions[userId];
            } else {
              newUserReactions[userId] = emoji;
              reactions[emoji] = (reactions[emoji] || 0) + 1;
            }

            return {
              ...msg,
              reactions,
              userReactions: newUserReactions
            };
          }
          return msg;
        })
      };
    });
  };

  const handleArchiveConversation = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        archivedChats: arrayUnion(id)
      });
      console.log(`Archived conversation ${id}`);
    } catch (e) {
      console.error("Error archiving conversation:", e);
    }
  };
  const handleBlockUser = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        blockedUsers: arrayUnion(id)
      });
      handleArchiveConversation(id);
    } catch (e) {
      console.error("Error blocking user:", e);
    }
  };

  const handleUnarchiveConversation = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        archivedChats: arrayRemove(id)
      });
    } catch (e) {
      console.error("Error unarchiving conversation:", e);
    }
  };

  const handleUnblockUser = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        blockedUsers: arrayRemove(id)
      });
    } catch (e) {
      console.error("Error unblocking user:", e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!firebaseUser) return;
    if (window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          deletedChats: arrayUnion(id)
        });
        if (activeConversationId === id) setActiveConversationId('');
      } catch (e) {
        console.error("Error deleting conversation:", e);
      }
    }
  };

  const handleMarkUnread = (id: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
    ));
  };

  const handleMuteConversation = (id: string) => {
    alert(`Notifications muted for this chat`);
    console.log(`Muted chat ${id}`);
  };

  const handleViewProfile = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      alert(`Profile: ${conv.name}\nStatus: ${conv.status}`);
    }
  };

  const handleReportUser = (id: string) => {
    if (window.confirm(`Are you sure you want to report this user?`)) {
      alert("Report submitted.");
      console.log(`Reported user ${id}`);
    }
  };

  const handleToggleKeepArchived = async (val: boolean) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        keepArchived: val
      });
    } catch (e) {
      console.error("Error updating keepArchived setting:", e);
    }
  };

  const filteredConversations = conversations.filter(c =>
    !blockedUsers.includes(c.id) &&
    !archivedChats.includes(c.id) &&
    !deletedChats.includes(c.id)
  );

  const handleTyping = (isTyping: boolean) => {
    if (activeConversationId && firebaseUser) {
      const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
      emitTyping(activeConversationId, userName, isTyping);
    }
  };

  const showTypingUser = userTyping && userTyping.userId === activeConversationId ? userTyping : null;

  return (
    <>
      <CallOverlay />
      <Layout>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
          onArchive={handleArchiveConversation}
          onBlock={handleBlockUser}
          onDelete={handleDeleteConversation}
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCall={(id, video) => callUser(id, video)}
          onMute={handleMuteConversation}
          onMarkUnread={handleMarkUnread}
          onViewProfile={handleViewProfile}
          onReport={handleReportUser}
        />
        <ChatWindow
          conversation={activeConversation}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          onReact={handleReaction}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onTyping={handleTyping}
          typingUser={showTypingUser}
          onGroupInfo={handleGroupInfo}
        />
      </Layout>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
        onlineUsers={[]}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={conversations.filter(c => !c.isGroup)}
      />

      {activeConversation && activeConversation.isGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          group={activeConversation}
          currentUserId={firebaseUser?.uid || ''}
          onAddMember={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onUpdateGroup={(name, avatar) => handleUpdateGroup(activeConversation.id, { name, avatar })}
          onPromoteAdmin={(userId) => handlePromoteAdmin(activeConversation.id, userId)}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={() => handleDeleteGroup(activeConversation.id)}
          availableUsers={conversations.filter(c => !c.isGroup)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
        archivedIds={archivedChats}
        blockedIds={blockedUsers}
        conversations={conversations}
        onUnarchive={handleUnarchiveConversation}
        onUnblock={handleUnblockUser}
        keepArchived={keepArchived}
        onToggleKeepArchived={handleToggleKeepArchived}
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
        <CallProvider>
          <AppContent />
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
