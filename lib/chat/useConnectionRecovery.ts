"use client";

import { useEffect, useRef, useState } from 'react';
import { client } from '@/lib/appwrite.client';

export function useConnectionRecovery(isConnected: boolean, onReconnect?: () => void) {
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;

  useEffect(() => {
    if (!isConnected && retryCount < maxRetries) {
      // Exponential backoff with jitter to prevent thundering herd
      const baseDelay = 1000 * Math.pow(2, retryCount);
      const jitter = Math.random() * 1000; // Add up to 1 second random delay
      const delay = Math.min(baseDelay + jitter, 60000); // Max 60 seconds
      
      // Only log every few attempts to reduce spam
      if (retryCount < 3 || retryCount % 2 === 0) {
        console.log(`ConnectionRecovery: Retrying in ${Math.round(delay)}ms (${retryCount + 1}/${maxRetries})`);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        onReconnect?.();
      }, delay);
    } else if (isConnected) {
      // Reset retry count on successful connection
      if (retryCount > 0) {
        console.log(`ConnectionRecovery: Connection restored after ${retryCount} attempts`);
      }
      setRetryCount(0);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isConnected, retryCount, maxRetries, onReconnect]);

  const resetRetryCount = () => setRetryCount(0);

  return { retryCount, maxRetries, resetRetryCount };
}
