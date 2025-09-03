"use client";

import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/chat/useChat";
import { useChat } from "@/lib/chat/useChat";
import { users } from "@/lib/appwrite.config";

export function ChatDialog({
  roomId, role, user, open, onOpenChange
}:{ 
  roomId:string; 
  role: Role; 
  user:{id:string; name:string};
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { adminOnline, approved, pending, chatEnded, denied, messages, typingFrom, sendMessage, sendTyping, end, request, refresh, refreshing, inactivityMinutes, showInactivityWarning, resetInactivityTimer, endedBy } = useChat(roomId, role);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag and minimize functionality
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
    // Simple positioning - bottom right but safe
    setDragPosition({
      x: window.innerWidth - 420,  // 380px width + 40px margin
      y: window.innerHeight - 540  // 500px height + 40px margin
    });
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Admin should always be approved when the chat is active
  const isApproved = role === "admin" ? true : approved;
  
  // For patient, show online status based on adminOnline
  // For admin, always show as online
  const showOnline = role === "admin" ? true : adminOnline;

  // Allow typing if admin is online (for patient) or if approved, but not if chat ended or denied
  const canType = role === "admin" ? !chatEnded : (adminOnline && (approved || !pending) && !chatEnded && !denied);

  // Debug logging for patient state
  useEffect(() => {
    if (role === "patient") {
      console.log(`ChatDialog DEBUG: role=${role}, approved=${approved}, pending=${pending}, adminOnline=${adminOnline}, canType=${canType}, chatEnded=${chatEnded}`);
    }
  }, [role, approved, pending, adminOnline, canType, chatEnded]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Removed automatic chat ending when dialog closes - this was interfering with approval process

  const handleSend = () => {
    if (text.trim() && canType) {
      // Stop typing indicator immediately
      sendTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (role === "patient" && !approved) {
        // Send initial request using the useChat hook
        console.log("ChatDialog: Patient sending request with user:", user);
        request(user);
      } else {
        // Send regular message
        console.log("ChatDialog: Sending regular message:", text.trim());
        sendMessage(text.trim());
      }
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnd = () => {
    end();
    onOpenChange(false);
  };

  const handleRefresh = () => {
    console.log("ChatDialog: Patient refreshing chat");
    refresh(user);
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from chat header (full chat) or anywhere on minimized bubble
    const isHeaderDrag = (e.target as HTMLElement).closest('.chat-header');
    const isMinimizedDrag = isMinimized;
    
    if (isHeaderDrag || isMinimizedDrag) {
      e.preventDefault(); // Prevent text selection during drag
      setDragStartPos({ x: e.clientX, y: e.clientY });
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

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        sendTyping(false);
      }
    };
  }, []);

  if (!open || !isClient) return null;

  // Minimized state
  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          top: `${dragPosition.y}px`,
          left: `${dragPosition.x}px`,
          zIndex: 99999,
          cursor: "pointer"
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          // Only maximize if this was a click (not a drag)
          const dragDistance = Math.sqrt(
            Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
          );
          if (dragDistance < 5) { // Less than 5px = click, not drag
            setIsMinimized(false);
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `scale(1.05)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `scale(1)`;
        }}
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
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: showOnline ? "#10b981" : "#ef4444" }} />
          Chat: {role === "admin" ? "Admin" : "Support"} ({messages.length} messages)
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: `${dragPosition.y}px`,
        left: `${dragPosition.x}px`,
        width: "380px", // Fixed width for messenger style
        height: "500px", // Fixed height for consistency
        background: "linear-gradient(135deg, #1f2937 0%, #0b1220 100%)",
        border: "1px solid #374151",
        borderRadius: 16,
        boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        zIndex: 99999
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        className="chat-header"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #374151",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "move"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#e5e7eb", fontWeight: "600" }}>
            Chat: {role === "admin" ? "Admin" : "Support"}
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: showOnline ? "#10b981" : "#ef4444" }} />
          <span style={{ color: showOnline ? "#10b981" : "#ef4444", fontSize: "12px" }}>
            {showOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "16px",
              padding: 4,
              borderRadius: 4,
              transition: "background-color 0.2s"
            }}
          >
            −
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "18px",
              padding: 4,
              borderRadius: 4,
              transition: "background-color 0.2s"
            }}
          >
            ×
          </button>
        </div>
      </div>
      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        {role === "patient" && !approved && !pending && adminOnline && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
            Type a message to start a conversation
          </div>
        )}
        
        {role === "patient" && !adminOnline && (
          <div style={{ textAlign: "center", color: "#ef4444", padding: "20px" }}>
            Admin is offline. Please try again later.
          </div>
        )}
        
        {role === "patient" && pending && !denied && (
          <div style={{ textAlign: "center", color: "#fbbf24", padding: "20px" }}>
            Waiting for admin approval...
          </div>
        )}

        {role === "patient" && denied && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ color: "#ef4444", marginBottom: "15px", background: "#1f1f1f", borderRadius: 8, padding: "15px" }}>
              ❌ Your chat request was denied by the admin.
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: refreshing ? "#6b7280" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: refreshing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: refreshing ? 0.7 : 1
              }}
            >
              {refreshing ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        )}

        {role === "patient" && approved && !pending && messages.length === 0 && !chatEnded && !denied && (
          <div style={{ textAlign: "center", color: "#10b981", padding: "20px" }}>
            ✅ Chat approved! You can now message the admin.
          </div>
        )}

        {/* 🔧 INACTIVITY WARNING DISPLAY */}
        {showInactivityWarning && inactivityMinutes > 0 && inactivityMinutes < 5 && (
          <div style={{ textAlign: "center", padding: "10px" }}>
            <div style={{
              color: "#fbbf24",
              background: "#1f1f1f",
              borderRadius: 8,
              padding: "10px",
              border: "1px solid #fbbf24"
            }}>
              ⚠️ {inactivityMinutes === 1 && "Are you still there?"}
              {inactivityMinutes === 2 && "Please respond if you need assistance"}
              {inactivityMinutes === 3 && "This chat will end soon due to inactivity"}
              {inactivityMinutes === 4 && "Chat will end in 1 minute"}
            </div>
          </div>
        )}

        {chatEnded && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ color: "#ef4444", marginBottom: "15px", background: "#1f1f1f", borderRadius: 8, padding: "15px" }}>
              🔒 Chat has been ended{endedBy ? ` by the ${endedBy === "admin" ? "admin" : "patient"}` : ""}.
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: refreshing ? "#6b7280" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: refreshing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: refreshing ? 0.7 : 1
              }}
            >
              {refreshing ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        )}

        {isApproved && messages.length === 0 && role === "admin" && !chatEnded && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
            Start typing to begin the conversation
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.from === "system" ? "center" : (msg.from === role ? "flex-end" : "flex-start"),
              maxWidth: msg.from === "system" ? "90%" : "70%"
            }}
          >
            <div style={{
              background: msg.from === "system" ? "#fbbf24" : (msg.from === role ? "#3b82f6" : "#374151"),
              color: msg.from === "system" ? "#000" : "#e5e7eb",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: "14px",
              textAlign: msg.from === "system" ? "center" : "left",
              fontWeight: msg.from === "system" ? "500" : "normal"
            }}>
              {msg.from === "system" ? "🤖 " : ""}{msg.text}
            </div>
            <div style={{
              color: "#9ca3af",
              fontSize: "11px",
              marginTop: 4,
              textAlign: msg.from === "system" ? "center" : (msg.from === role ? "right" : "left")
            }}>
              {new Date(msg.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {typingFrom && typingFrom !== role && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{
              background: "#374151",
              color: "#9ca3af",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: "14px",
              fontStyle: "italic"
            }}>
              {typingFrom === "admin" ? "Admin" : "User"} is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input - Hide when chat is ended or denied */}
      {!chatEnded && !denied && (
        <div style={{
          padding: "16px",
          borderTop: "1px solid #374151",
          display: "flex",
          gap: 8
        }}>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            
            // Send typing indicator
            if (canType) {
              sendTyping(true);

              // Clear existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }

              // Stop typing after 2 seconds of inactivity
              typingTimeoutRef.current = setTimeout(() => {
                sendTyping(false);
              }, 2000);
            }

            // 🔧 RESET INACTIVITY TIMER when user types
            if (role === "patient" && e.target.value !== text) {
              resetInactivityTimer();
            }
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            sendTyping(true);
            // 🔧 RESET INACTIVITY TIMER when user focuses
            if (role === "patient") {
              resetInactivityTimer();
            }
          }}
          placeholder={
            chatEnded ? "Chat has ended" : 
            denied ? "Request denied" :
            (role === "patient" && !approved ? "Type to send request..." : "Type a message...")
          }
          disabled={!canType}
          style={{
            flex: 1,
            background: "#374151",
            border: "1px solid #4b5563",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#e5e7eb",
            fontSize: "14px"
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !canType}
          style={{
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
            opacity: (!text.trim() || !canType) ? 0.5 : 1
          }}
        >
          {role === "patient" && !approved ? "Send Request" : "Send"}
        </button>
        <button
          onClick={handleEnd}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          End
        </button>
        </div>
      )}
    </div>
  );
}