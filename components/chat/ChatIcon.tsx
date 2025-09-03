"use client";

import { useChat } from "@/lib/chat/useChat";

export function ChatIcon({ roomId, user, onOpen }:{ 
  roomId: string; 
  user: {id:string; name:string};
  onOpen: () => void;
}) {
  const { adminOnline, pending, approved, unread, request, clearUnread } = useChat(roomId, "patient");

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { 
          if (!approved && !pending) {
            request(user);
          }
          onOpen();
        }}
        style={{
          background: "#3b82f6", // BLUE BACKGROUND FOR VISIBILITY
          border: "2px solid #ffffff", // WHITE BORDER
          color: "#ffffff",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 4
        }}
      >
        <div style={{ fontSize: "20px" }}>💬</div>
        {unread > 0 && (
          <div style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: "#ef4444",
            color: "white",
            borderRadius: "50%",
            width: 16,
            height: 16,
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unread}
          </div>
        )}
      </button>
      
      {/* Admin status indicator */}
      <div style={{
        position: "absolute",
        bottom: -4,
        right: -4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: adminOnline ? "#10b981" : "#ef4444",
        border: "2px solid #1f2937"
      }} />
    </div>
  );
}