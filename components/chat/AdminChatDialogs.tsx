"use client";

import { AdminChatDialog } from "./AdminChatDialog";

type Req = { roomId: string; user: { id: string; name: string } };

type Message = { text: string; from: "admin" | "patient" | "system"; ts: number };

export function AdminChatDialogs({
  activeChats,
  onCloseChat,
  messagesById,
  typingById,
  onSendMessage,
  onSendTyping,
  chatEndedById = {},
  endedById = {}
}: {
  activeChats: Req[];
  onCloseChat: (roomId: string) => void;
  messagesById: Record<string, Message[]>;
  typingById: Record<string, "patient" | null>;
  onSendMessage: (roomId: string, text: string) => void;
  onSendTyping: (roomId: string, isTyping: boolean) => void;
  chatEndedById?: Record<string, boolean>;
  endedById?: Record<string, "admin" | "patient">;
}) {
  console.log(`AdminChatDialogs: Rendering ${activeChats.length} chats`);
  console.log(`AdminChatDialogs: chatEndedById:`, chatEndedById);
  console.log(`AdminChatDialogs: endedById:`, endedById);
  return (
    <>
      {activeChats.map((chat) => {
        const isEnded = chatEndedById[chat.roomId] || false;
        const endedBy = endedById[chat.roomId];
        console.log(`AdminChatDialogs: Rendering chat ${chat.roomId} - ended=${isEnded}, endedBy=${endedBy}`);

        return (
          <AdminChatDialog
            key={chat.roomId}
            roomId={chat.roomId}
            user={chat.user}
            open={true}
            onClose={() => onCloseChat(chat.roomId)}
            messages={messagesById[chat.roomId] || []}
            typingFrom={typingById[chat.roomId] || null}
            onSendMessage={onSendMessage}
            onSendTyping={onSendTyping}
            chatEnded={isEnded}
            endedBy={endedBy}
          />
        );
      })}
    </>
  );
}
