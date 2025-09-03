"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminChatDialogs } from "./AdminChatDialogs";
import { client, databases } from "@/lib/appwrite.client";
import { useRealtimeStatus } from "@/lib/chat/useRealtimeStatus";
import { testConnection } from "@/lib/chat/debugConnection";
import { usePolling } from "@/lib/chat/usePolling";

import { useConnectionRecovery } from "@/lib/chat/useConnectionRecovery";
import { testAppwriteConnection, testWebSocketSupport, testNetworkConnectivity } from "@/lib/chat/connectionTest";
import { testAppwriteAuth, diagnoseConnectionIssue } from "@/lib/chat/fixAppwriteAuth";
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
  const { connected, connectionError } = useRealtimeStatus();
  const [requests, setRequests] = useState<Req[]>([]);
  const [activeChats, setActiveChats] = useState<Req[]>([]);
  const [closedChats, setClosedChats] = useState<Req[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  
  // Real-time strategy: Appwrite subscriptions primary, polling fallback only
  // Heartbeat system disabled - using Appwrite real-time exclusively
  const { retryCount, maxRetries } = useConnectionRecovery(connected, () => {
    loadData(); // Retry loading data on connection recovery
  });
  
  // Polling fallback for when WebSocket fails
  const loadData = async () => {
    try {
      const pendingRooms = await getPendingChatRooms();
      
      const formattedPending = pendingRooms.map(room => ({
        roomId: room.roomId,
        user: { id: room.patientId, name: room.patientName }
      }));
      
      setRequests(formattedPending);
    } catch (error) {
      console.error('AdminChatDock: Error loading data:', error);
    }
  };
  
  // Conditional and slower polling - only when needed
  const shouldPoll = !connected || requests.length > 0 || activeChats.length > 0;
  usePolling(shouldPoll ? loadData : null, connected ? 20000 : 10000);
  
  // Poll messages for active chats - optimized
  const pollActiveMessages = useCallback(async () => {
    if (activeChats.length > 0) {
      for (const chat of activeChats) {
        try {
          const messages = await getChatMessages(chat.roomId);
          const formattedMessages = messages.map(msg => ({
            text: msg.messageText,
            from: msg.senderRole as "admin" | "patient" | "system",
            ts: msg.timestamp.getTime()
          }));
          
          // Update messages for this room
          setMessagesById(prev => {
            const currentCount = prev[chat.roomId]?.length || 0;
            if (formattedMessages.length !== currentCount) {
              return {
                ...prev,
                [chat.roomId]: formattedMessages
              };
            }
            return prev;
          });
        } catch (error) {
          console.error(`AdminChatDock: Error polling messages for ${chat.roomId}:`, error);
        }
      }
    }
  }, [activeChats]);
  
  // Conditional message polling - only when connected or have active chats
  const shouldPollMessages = connected && activeChats.length > 0;
  usePolling(shouldPollMessages ? pollActiveMessages : null, 15000);
  
  // HUB: Manage all messages and typing states by roomId
  const [messagesById, setMessagesById] = useState<Record<string, Array<{text: string; from: "admin" | "patient" | "system"; ts: number}>>>({});
  const [typingById, setTypingById] = useState<Record<string, "patient" | null>>({});
  const [chatEndedById, setChatEndedById] = useState<Record<string, boolean>>({});
  const [endedById, setEndedById] = useState<Record<string, "admin" | "patient">>({});
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

        setConnectionStatus(connected ? "Connected (Real-time)" : "Connected (Polling)");
        setIsOnline(true);
        
        console.log("AdminChatDock: Initialization complete");
        console.log(`🔗 Realtime connection status: ${connected ? 'Connected' : 'Disconnected'}`);
        if (connectionError) {
          console.error(`🚨 Connection error: ${connectionError}`);
        }
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
      [
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents`,
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents.*.create`,
        `databases.${CLIENT_DATABASE_ID}.collections.${CLIENT_CHAT_ROOMS_COLLECTION_ID}.documents.*.update`
      ],
      (response: any) => {
        console.log(`🔄 AdminChatDock: Room subscription received:`, response);
        if (response.payload) {
          const roomData = response.payload;
          console.log(`📨 AdminChatDock: Room ${roomData.roomId} status changed to: ${roomData.status}`);
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
              // Mark chat as ended first - keep it in activeChats so dialog can show ended message
              setChatEndedById(prev => ({
                ...prev,
                [roomData.roomId]: true
              }));

              // Capture who ended the chat
              if (roomData.endedBy) {
                setEndedById(prev => ({
                  ...prev,
                  [roomData.roomId]: roomData.endedBy
                }));
                console.log(`📝 AdminChatDock: Chat ${roomData.roomId} ended by ${roomData.endedBy}`);
              }

              // Move from active to closed after a longer delay to show ended message
              setTimeout(() => {
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
                setChatEndedById(prev => {
                  const newState = { ...prev };
                  delete newState[roomData.roomId];
                  return newState;
                });
                setEndedById(prev => {
                  const newState = { ...prev };
                  delete newState[roomData.roomId];
                  return newState;
                });
              }, 5000); // Increased to 5 seconds to show ended message
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
      console.log(`🔵 AdminChatDock: Approving chat ${roomId}`);
      
      // Optimistically move from pending to active
      setRequests(prev => {
        const request = prev.find(r => r.roomId === roomId);
        if (request) {
          console.log(`🔄 AdminChatDock: Moving room ${roomId} to active chats`);
          setActiveChats(prevActive => {
            if (!prevActive.some(chat => chat.roomId === roomId)) {
              return [...prevActive, request];
            }
            return prevActive;
          });
        }
        return prev.filter(r => r.roomId !== roomId);
      });
      
      console.log(`💾 AdminChatDock: Calling approveChatRequest for roomId: ${roomId}`);
      await approveChatRequest(roomId, "admin");
      console.log(`✅ AdminChatDock: Successfully approved chat ${roomId}`);
    } catch (error) {
      console.error("❌ AdminChatDock: Error approving chat:", error);
    }
  };

  const handleDeny = async (roomId: string) => {
    try {
      console.log(`AdminChatDock: Denying chat ${roomId}`);
      
      // Optimistically remove from UI immediately
      setRequests(prev => {
        console.log(`AdminChatDock: Removing room ${roomId} from pending requests`);
        return prev.filter(r => r.roomId !== roomId);
      });
      
      await denyChatRequest(roomId);
      console.log(`AdminChatDock: Successfully denied chat ${roomId}`);
    } catch (error) {
      console.error("AdminChatDock: Error denying chat:", error);
      
      // If error, we could reload the requests to get correct state
      // For now, the optimistic update will remain
    }
  };

  const handleCloseChat = async (roomId: string) => {
    try {
      console.log(`AdminChatDock: Ending chat ${roomId}`);

      // Mark chat as ended immediately for UI feedback
      setChatEndedById(prev => ({
        ...prev,
        [roomId]: true
      }));

      // Set who ended the chat (admin)
      setEndedById(prev => ({
        ...prev,
        [roomId]: "admin"
      }));

      // End the chat session in database
      await endChatSession(roomId, "admin");

      // Remove from active chats IMMEDIATELY (no delay)
      setActiveChats(prev => prev.filter(chat => chat.roomId !== roomId));

      // Clear messages and states for ended chat immediately
      setMessagesById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });

      setTypingById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });

      setChatEndedById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });

      setEndedById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });

      console.log(`AdminChatDock: Successfully ended chat ${roomId} - dialog removed immediately`);
    } catch (error) {
      console.error("AdminChatDock: Error ending chat:", error);
      // Remove the ended flag if error occurred
      setChatEndedById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });
      setEndedById(prev => {
        const newState = { ...prev };
        delete newState[roomId];
        return newState;
      });
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
    
    setMessagesById(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage]
    }));

    try {
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
            <div style={{ color: "#9ca3af", fontSize: "12px", marginBottom: 4 }}>
              Status: {connectionStatus} {connected ? '🟢' : '🔴'}
              {retryCount > 0 && ` (Retry ${retryCount}/${maxRetries})`}
            </div>
            {connectionError && (
              <div style={{ color: "#ef4444", fontSize: "10px" }}>Error: {connectionError}</div>
            )}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button
                onClick={async () => {
                  console.log("🔄 Manual refresh triggered");
                  const [pendingRooms, activeRooms] = await Promise.all([
                    getPendingChatRooms(),
                    getActiveChatRooms()
                  ]);
                  const formattedPending = pendingRooms.map(room => ({
                    roomId: room.roomId,
                    user: { id: room.patientId, name: room.patientName }
                  }));
                  setRequests(formattedPending);
                  console.log(`🔄 Loaded ${formattedPending.length} pending requests`);
                }}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: "10px",
                  cursor: "pointer"
                }}
              >
                Refresh
              </button>
              <button
                onClick={() => testConnection()}
                style={{
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: "10px",
                  cursor: "pointer"
                }}
              >
                Test Connection
              </button>
              <button
                onClick={async () => {
                  console.log('🔍 Running comprehensive connection tests...');
                  diagnoseConnectionIssue();
                  await testAppwriteAuth();
                  await testWebSocketSupport();
                  await testNetworkConnectivity(); 
                  await testAppwriteConnection();
                  console.log('🔍 Connection tests completed. Check console for results.');
                }}
                style={{
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: "10px",
                  cursor: "pointer"
                }}
              >
                Fix Auth
              </button>
            </div>
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
        chatEndedById={chatEndedById}
        endedById={endedById}
      />
    </>
  );
}