"use client";

import { useState, useEffect } from 'react';
import { client } from '@/lib/appwrite.client';

export function useRealtimeStatus() {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔗 Setting up realtime connection monitoring');
    
    // Monitor connection status
    let connectionTimeout: NodeJS.Timeout;
    
    try {
      console.log('🔗 Testing realtime connection...');
      
      // Set initial timeout
      connectionTimeout = setTimeout(() => {
        console.error('❌ Realtime connection timeout');
        setConnected(false);
        setConnectionError('Connection timeout');
      }, 5000);
      
      // Test with actual chat channels using standardized IDs
      const chatChannel = `databases.${process.env.NEXT_PUBLIC_DATABASE_ID || process.env.DATABASE_ID || '687670ff00238795d9bf'}.collections.${process.env.NEXT_PUBLIC_CHAT_PRESENCE_COLLECTION_ID || process.env.CHAT_PRESENCE_COLLECTION_ID || '68a6c6cf0032a4edff19'}.documents`;
      
      console.log('🎯 Testing realtime on channel:', chatChannel);
      
      const testSubscription = client.subscribe(
        chatChannel,
        (response) => {
          console.log('✅ Realtime connection established:', chatChannel);
          clearTimeout(connectionTimeout);
          setConnected(true);
          setConnectionError(null);
        },
        (error) => {
          console.error('❌ Realtime connection failed:', error);
          clearTimeout(connectionTimeout);
          setConnected(false);
          setConnectionError(error.message || 'Connection failed');
        }
      );
      
      // Test if client is properly configured
      console.log('🔧 Client endpoint:', client);
      
      return () => {
        clearTimeout(connectionTimeout);
        if (typeof testSubscription === 'function') {
          testSubscription();
        }
      };
    } catch (error: any) {
      console.error('❌ Failed to setup realtime connection:', error);
      setConnected(false);
      setConnectionError(error.message || 'Setup failed');
    }

    return () => {
      if (typeof testSubscription === 'function') {
        testSubscription();
      }
    };
  }, []);

  return { connected, connectionError };
}
