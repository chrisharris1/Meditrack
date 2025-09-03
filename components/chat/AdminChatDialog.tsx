"use client";

import { useEffect, useRef, useState } from "react";

type Message = { text: string; from: "admin" | "patient" | "system"; ts: number };

export function AdminChatDialog({
  roomId, user, open, onClose, messages, typingFrom, onSendMessage, onSendTyping, chatEnded = false, endedBy
}:{
  roomId: string;
  user: {id: string; name: string};
  open: boolean;
  onClose: () => void;
  messages: Message[];
  typingFrom: "patient" | null;
  onSendMessage: (roomId: string, text: string) => void;
  onSendTyping: (roomId: string, isTyping: boolean) => void;
  chatEnded?: boolean;
  endedBy?: "admin" | "patient";
}) {
  // Debug logging for ended state
  console.log(`AdminChatDialog ${roomId}: chatEnded=${chatEnded}, endedBy=${endedBy}`);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag and minimize functionality
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Position dialogs in a cascade pattern
  useEffect(() => {
    setIsClient(true);
    // Calculate position based on roomId hash to avoid overlaps
    const hash = roomId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const offset = Math.abs(hash) % 3; // 0, 1, or 2
    setDragPosition({
      x: window.innerWidth - 420 - (offset * 40),  // Cascade horizontally
      y: window.innerHeight - 540 - (offset * 40)  // Cascade vertically
    });
  }, [roomId]);

  // NO SSE CONNECTION - Pure UI component that receives messages via props

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      // Stop typing indicator immediately
      onSendTyping(roomId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Use parent's send message handler
      onSendMessage(roomId, text.trim());
      setText("");
    }
  };

  const sendTyping = (isTyping: boolean) => {
    onSendTyping(roomId, isTyping);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnd = async () => {
    try {
      // End the chat session via the parent component
      onClose(); // Close the dialog immediately for admin
    } catch (error) {
      console.error("Error ending chat:", error);
    }
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    const isHeaderDrag = (e.target as HTMLElement).closest('.chat-header');
    const isMinimizedDrag = isMinimized;
    
    if (isHeaderDrag || isMinimizedDrag) {
      e.preventDefault();
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
          const dragDistance = Math.sqrt(
            Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
          );
          if (dragDistance < 5) {
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
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          Chat: {user.name} ({messages.length} messages)
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
        width: "380px",
        height: "500px",
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
            Chat: {user.name}
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ color: "#10b981", fontSize: "12px" }}>
            Online
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
              onClose();
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
        {chatEnded && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ color: "#ef4444", marginBottom: "15px", background: "#1f1f1f", borderRadius: 8, padding: "15px" }}>
              🔒 Chat has been ended{endedBy ? ` by the ${endedBy === "admin" ? "admin" : "patient"}` : ""}.
            </div>
          </div>
        )}

        {!chatEnded && messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
            Start typing to begin the conversation with {user.name}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.from === "system" ? "center" : (msg.from === "admin" ? "flex-end" : "flex-start"),
              maxWidth: msg.from === "system" ? "90%" : "70%"
            }}
          >
            <div style={{
              background: msg.from === "system" ? "#fbbf24" : (msg.from === "admin" ? "#3b82f6" : "#374151"),
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
              textAlign: msg.from === "system" ? "center" : (msg.from === "admin" ? "right" : "left")
            }}>
              {new Date(msg.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {typingFrom && typingFrom === "patient" && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{
              background: "#374151",
              color: "#9ca3af",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: "14px",
              fontStyle: "italic"
            }}>
              {user.name} is typing...
            </div>
          </div>
        )}
      </div>

      {/* Input - Hide when chat is ended */}
      {!chatEnded && (
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
            sendTyping(true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
              sendTyping(false);
            }, 2000);
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            sendTyping(true);
          }}
          placeholder="Type a message..."
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
          disabled={!text.trim()}
          style={{
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
            opacity: !text.trim() ? 0.5 : 1
          }}
        >
          Send
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
