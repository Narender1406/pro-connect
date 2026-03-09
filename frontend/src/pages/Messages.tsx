import { useEffect, useState, useRef } from "react";
import { messageAPI } from "../api/message.api";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

interface Message {
  _id: string;
  sender: { _id: string; name: string; profilePic?: string };
  recipient: { _id: string; name: string; profilePic?: string };
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  lastMessage: Message;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await messageAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Load conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const data = await messageAPI.getMessages(userId);
      setMessages(data);
      await messageAPI.markAsRead(userId);
    } catch (error) {
      console.error("Load messages error:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const message = await messageAPI.sendMessage(selectedUser._id, newMessage);
      setMessages([...messages, message]);
      setNewMessage("");
      loadConversations();
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button className="btn-icon btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        <div className="conversations-list">
          {conversations.map((conv) => {
            const otherUser = conv.lastMessage.sender._id === user?.id 
              ? conv.lastMessage.recipient 
              : conv.lastMessage.sender;
            
            return (
              <div
                key={conv._id}
                className={`conversation-item ${selectedUser?._id === otherUser._id ? "active" : ""}`}
                onClick={() => setSelectedUser(otherUser)}
              >
                <div className="conversation-avatar">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="conversation-info">
                  <h4>{otherUser.name}</h4>
                  <p>{conv.lastMessage.content.substring(0, 40)}...</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="messages-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <div className="chat-avatar">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.name}</h3>
                  <span className="status-online">Online</span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="btn-icon btn-secondary" title="Voice Call">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </button>
                <button className="btn-icon btn-secondary" title="Video Call">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.sender._id === user?.id ? "sent" : "received"}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-form" onSubmit={handleSend}>
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn-primary btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <h3>Select a conversation</h3>
            <p>Choose from your existing conversations or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
