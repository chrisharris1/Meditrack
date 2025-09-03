"use client";

import { useEffect, useRef } from 'react';

export function usePolling(callback: (() => Promise<void>) | null, interval: number = 5000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Don't start polling if callback is null
    if (!callback) {
      console.log('🔄 Polling disabled (callback is null)');
      return;
    }
    
    console.log(`🔄 Starting polling with ${interval}ms interval`);
    
    // Run immediately
    callbackRef.current?.();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current?.();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🔄 Polling stopped');
      }
    };
  }, [callback, interval]);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🔄 Polling manually stopped');
    }
  };

  return { stopPolling };
}
