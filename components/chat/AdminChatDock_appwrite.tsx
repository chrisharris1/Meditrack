"use client";

import { useEffect, useState } from "react";
import { AdminChatDialogs } from "./AdminChatDialogs";
import { client, databases } from "@/lib/appwrite.client";
import {
  CLIENT_DATABASE_ID,
  CLIENT_CHAT_ROOMS_COLLECTION_ID,
  CLIENT_CHAT_MESSAGES_COLLECTION_ID,
  CLIENT_CHAT_PRESENCE_COLLECTION_ID
} from "@/lib/appwrite.client";
import {
  getPendingChatRooms,
  getActiveChatRooms,
  approveChatRequest,
  denyChatRequest,
  endChatSession,
  sendChatMessage,
  updateUserPresence,
  getChatMessages
} from "@/lib/actions/chat.actions";

type Req = { roomId: string; user: { id: string; name: string } };

export function AdminChatDock() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [activeChats, setActiveChats] = useState<Req[]>([]);
  const [closedChats, setClosedChats] = useState<Req[]>([]);
  
  // HUB: Manage all messages and typing states by roomId
  const [messagesById, setMessagesById] = useState<Record<string, Array<{text: string; from: "admin" | "patient" | "system"; ts: number}>>>({});
  const [typingById, setTypingById] = useState<Record<string, "patient" | null>>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Initialize admin data and set presence
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        console.log("AdminChatDock: Initializing admin...");
        
        // Set admin as online
        await updateUserPresence({
          userId: "admin",
          role: "admin",
          isOnline: true
        });

        // Load initial data
        const [pendingRooms, activeRooms] = await Promise.all([
          getPendingChatRooms(),
          getActiveChatRooms()
        ]);

        // Convert to the format expected by the component
        const formattedPending = pendingRooms.map(room => ({
          roomId: room.roomId,
          user: { id: room.patientId, name: room.patientName }
        }));

        const formattedActive = activeRooms.map(room => ({
          roomId: room.roomId,
          user: { id: room.patientId, name: room.patientName }
        }));

        setRequests(formattedPending);
        setActiveChats(formattedActive);

        // Load messages for active chats
        for (const room of activeRooms) {
          const messages = await getChatMessages(room.roomId);
          const formattedMessages = messages.map(msg => ({
            text: msg.messageText,
            from: msg.senderRole as "admin" | "patient" | "system",
            ts: msg.timestamp.getTime()
          }));
          
          setMessagesById(prev => ({
            ...prev,
            [room.roomId]: formattedMessages
          }));
        }

        setConnectionStatus("Connected");
        setIsOnline(true);
        
        console.log("AdminChatDock: Initialization complete");
      } catch (error) {
        console.error("AdminChatDock: Initialization error:", error);
        setConnectionStatus("Connection error");
      }
    };

    initializeAdmin();
  }, []);

  // Subscribe to chat room changes (new requests, approvals, etc.)
  useEffect(() => {
    console.log("AdminChatDock: Setting up room subscriptions");
    
    const unsubscribeRoom = client.subscribe(
      `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents`,
      (response: any) => {
        console.log("AdminChatDock: Room update received:", response);
        
        if (response.payload) {
          const roomData = response.payload;
          const formattedRoom = {
            roomId: roomData.roomId,
            user: { id: roomData.patientId, name: roomData.patientName }
          };

          switch (roomData.status) {
            case "pending":
              // Add to pending requests if not already there
              setRequests(prev => {
                if (!prev.some(req => req.roomId === roomData.roomId)) {
                  return [...prev, formattedRoom];
                }
                return prev;
              });
              break;
              
            case "active":
              // Move from pending to active
              setRequests(prev => prev.filter(r => r.roomId !== roomData.roomId));
              setActiveChats(prev => {
                if (!prev.some(chat => chat.roomId === roomData.roomId)) {
                  return [...prev, formattedRoom];
                }
                return prev;
              });
              break;
              
            case "ended":
              // Move from active to closed
              setActiveChats(prev => {
                const activeChat = prev.find(r => r.roomId === roomData.roomId);
                if (activeChat) {
                  setClosedChats(prevClosed => {
                    if (!prevClosed.some(chat => chat.roomId === roomData.roomId)) {
                      return [...prevClosed, activeChat];
                    }
                    return prevClosed;
                  });
                }
                return prev.filter(r => r.roomId !== roomData.roomId);
              });
              
              // Clear messages and typing for ended chats
              setMessagesById(prev => {
                const newState = { ...prev };
                delete newState[roomData.roomId];
                return newState;
              });
              setTypingById(prev => {
                const newState = { ...prev };
                delete newState[roomData.roomId];
                return newState;
              });
              break;
              
            case "denied":
              // Remove from pending
              setRequests(prev => prev.filter(r => r.roomId !== roomData.roomId));
              break;
          }
        }
      }
    );

    return () => {
      if (typeof unsubscribeRoom === 'function') {
        unsubscribeRoom();
      }
    };
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    console.log("AdminChatDock: Setting up message subscriptions");
    
    const unsubscribeMessages = client.subscribe(
      `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_MESSAGES_COLLECTION_ID}.documents`,
      (response: any) => {
        console.log("AdminChatDock: Message update received:", response);
        
        if (response.payload && response.payload.senderRole !== "admin") {
          // Only add messages from patients (avoid duplicates from our own messages)
          const newMessage = {
            text: response.payload.messageText,
            from: response.payload.senderRole as "admin" | "patient" | "system",
            ts: new Date(response.payload.timestamp).getTime()
          };
          
          setMessagesById(prev => ({
            ...prev,
            [response.payload.roomId]: [...(prev[response.payload.roomId] || []), newMessage]
          }));
        }
      }
    );

    return () => {
      if (typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
    };
  }, []);

  // Subscribe to presence changes (typing indicators)
  useEffect(() => {
    console.log("AdminChatDock: Setting up presence subscriptions");
    
    const unsubscribePresence = client.subscribe(
      `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_PRESENCE_COLLECTION_ID}.documents`,
      (response: any) => {
        console.log("AdminChatDock: Presence update received:", response);
        
        if (response.payload && response.payload.role === "patient") {
          const roomId = response.payload.currentRoomId;
          if (roomId && response.payload.isTyping !== undefined) {
            setTypingById(prev => ({
              ...prev,
              [roomId]: response.payload.isTyping ? "patient" : null
            }));
          }
        }
      }
    );

    return () => {
      if (typeof unsubscribePresence === 'function') {
        unsubscribePresence();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      updateUserPresence({
        userId: "admin",
        role: "admin",
        isOnline: false
      });
    };
  }, []);

  const handleApprove = async (roomId: string) => {
    try {
      await approveChatRequest(roomId, "admin");
      console.log(`AdminChatDock: Approved chat ${roomId}`);
    } catch (error) {
      console.error("AdminChatDock: Error approving chat:", error);
    }
  };

  const handleDeny = async (roomId: string) => {
    try {
      await denyChatRequest(roomId);
      console.log(`AdminChatDock: Denied chat ${roomId}`);
    } catch (error) {
      console.error("AdminChatDock: Error denying chat:", error);
    }
  };

  const handleCloseChat = async (roomId: string) => {
    try {
      await endChatSession(roomId);
      console.log(`AdminChatDock: Ended chat ${roomId}`);
    } catch (error) {
      console.error("AdminChatDock: Error ending chat:", error);
    }
  };

  const handleCancelChat = (roomId: string) => {
    console.log(`AdminChatDock: Removing closed chat ${roomId} from list`);
    setClosedChats(prev => prev.filter(r => r.roomId !== roomId));
  };

  // HUB: Handle message sending from any dialog
  const handleSendMessage = async (roomId: string, text: string) => {
   
      console.log(`AdminChatDock HUB: Sending message to room ${roomId}: "${text}"`);
      
      // Add to local state immediately for admin to see
      const newMessage = {
        text: text,
        from: "admin" as const,
        ts: Date.now()
      };
       try {
      setMessagesById(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), newMessage]
      }));

      // Send to database
      await sendChatMessage({
        roomId,
        messageText: text,
        senderRole: "admin",
        senderName: "Admin"
      });
    } catch (error) {
      console.error("AdminChatDock: Error sending message:", error);
      // Remove from UI if database save failed
      setMessagesById(prev => ({
        ...prev,
        [roomId]: prev[roomId]?.filter(msg => !(msg.text === text && msg.from === "admin" && msg.ts === newMessage.ts)) || []
      }));
    }
  };

  // HUB: Handle typing indicators from any dialog
  const handleSendTyping = async (roomId: string, isTyping: boolean) => {
    try {
      await updateUserPresence({
        userId: "admin",
        role: "admin",
        isOnline: true,
        currentRoomId: roomId,
        isTyping: isTyping
      });
    } catch (error) {
      console.error("AdminChatDock: Error sending typing indicator:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - dragPosition.x,
        y: e.clientY - dragPosition.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setDragPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20 + dragPosition.x,
          zIndex: 1000,
          cursor: "pointer"
        }}
        onMouseDown={handleMouseDown}
        onClick={() => setIsMinimized(false)}
      >
        <div style={{
          background: "linear-gradient(135deg, #1f2937 0%, #0b1220 100%)",
          border: "1px solid #374151",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          color: "#e5e7eb",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#10b981" : "#ef4444" }} />
          Admin Chat ({activeChats.length} active, {requests.length} pending)
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20 + dragPosition.x,
          width: 320,
          maxHeight: 500,
          zIndex: 1000,
          background: "linear-gradient(135deg, #1f2937 0%, #0b1220 100%)",
          border: "1px solid #374151",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          overflow: "hidden"
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #374151",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "move"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#10b981" : "#ef4444" }} />
            <span style={{ color: "#e5e7eb", fontWeight: "600" }}>Admin Chat</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4
              }}
            >
              −
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxHeight: 400, overflowY: "auto", padding: "16px" }}>
          {/* Connection Status */}
          <div style={{ marginBottom: 16, padding: "8px 12px", background: "#374151", borderRadius: 8 }}>
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>Status: {connectionStatus}</div>
          </div>

          {/* Pending Requests */}
          {requests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#e5e7eb", fontWeight: "600", marginBottom: 8 }}>Pending Requests ({requests.length})</div>
              {requests.map((req, index) => (
                <div key={`request-${req.roomId}-${index}`} style={{
                  padding: "12px",
                  background: "#374151",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid #4b5563"
                }}>
                  <div style={{ color: "#e5e7eb", marginBottom: 4 }}>{req.user?.name || "Patient"}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleApprove(req.roomId)}
                      style={{
                        background: "#10b981",
                        color: "white",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(req.roomId)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Chats */}
          {activeChats.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#e5e7eb", fontWeight: "600", marginBottom: 8 }}>Active Chats ({activeChats.length})</div>
              {activeChats.map((chat, index) => (
                <div key={`active-${chat.roomId}-${index}`} style={{
                  padding: "12px",
                  background: "#374151",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid #4b5563"
                }}>
                  <div style={{ color: "#e5e7eb", marginBottom: 4 }}>{chat.user?.name || "Patient"}</div>
                  <button
                    onClick={() => handleCloseChat(chat.roomId)}
                    style={{
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Close
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Closed Chats */}
          {closedChats.length > 0 && (
            <div>
              <div style={{ color: "#e5e7eb", fontWeight: "600", marginBottom: 8 }}>Closed Chats ({closedChats.length})</div>
              {closedChats.map((chat, index) => (
                <div key={`closed-${chat.roomId}-${index}`} style={{
                  padding: "12px",
                  background: "#374151",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid #4b5563"
                }}>
                  <div style={{ color: "#e5e7eb", marginBottom: 4 }}>{chat.user?.name || "Patient"}</div>
                  <button
                    onClick={() => handleCancelChat(chat.roomId)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}

          {requests.length === 0 && activeChats.length === 0 && closedChats.length === 0 && (
            <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
              No chat activity
            </div>
          )}
        </div>
      </div>

      {/* Render chat dialogs independently using AdminChatDialogs */}
      <AdminChatDialogs 
        activeChats={activeChats} 
        onCloseChat={handleCloseChat}
        messagesById={messagesById}
        typingById={typingById}
        onSendMessage={handleSendMessage}
        onSendTyping={handleSendTyping}
      />
    </>
  );
}
