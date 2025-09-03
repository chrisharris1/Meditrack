"use client";

import { useState } from "react";
import { ChatIcon } from "@/components/chat/ChatIcon";
import { ChatDialog } from "@/components/chat/ChatDialog";

export function ChatWrapper({ roomId, user }: { 
  roomId: string; 
  user: { id: string; name: string };
}) {
  const [open, setOpen] = useState(true); // Test positioning

  return (
    <>
      <ChatIcon 
        roomId={roomId} 
        user={user}
        onOpen={() => setOpen(true)}
      />
      <ChatDialog 
        roomId={roomId} 
        role="patient" 
        user={user}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
