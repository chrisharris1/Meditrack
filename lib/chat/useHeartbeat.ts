"use client";

import { useEffect, useRef } from 'react';
import { updateUserPresence } from '@/lib/actions/chat.actions';

export function useHeartbeat(userId: string, role: "admin" | "patient", isActive: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    console.log(`💓 Starting heartbeat for ${role} ${userId}`);
    
    // Send heartbeat every 5 minutes (much less frequent)
    intervalRef.current = setInterval(async () => {
      try {
        await updateUserPresence({
          userId,
          role,
          isOnline: true
        });
        console.log(`💓 Heartbeat sent for ${role} ${userId}`);
      } catch (error) {
        console.error(`💔 Heartbeat failed for ${role} ${userId}:`, error);
      }
    }, 300000); // 5 minutes instead of 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log(`💔 Heartbeat stopped for ${role} ${userId}`);
      }
    };
  }, [userId, role, isActive]);

  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stopHeartbeat };
}
