"use client";

import { client } from '@/lib/appwrite.client';

export const testAppwriteConnection = async () => {
  console.log('🔧 Testing Appwrite Connection...');
  
  // Test 1: Basic client configuration
  console.log('📋 Configuration:');
  console.log('- Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('- Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID);
  console.log('- Database ID:', process.env.NEXT_PUBLIC_DATABASE_ID);
  
  // Test 2: Real chat channel subscription test
  console.log('🔗 Testing real-time subscription on actual chat channels...');
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error('❌ Connection test timed out after 10 seconds');
      resolve({ success: false, error: 'Connection timeout' });
    }, 10000);

    try {
      // Test with actual chat presence channel (most active)
      const chatChannel = `databases.${process.env.NEXT_PUBLIC_DATABASE_ID || '687670ff00238795d9bf'}.collections.${process.env.NEXT_PUBLIC_CHAT_PRESENCE_COLLECTION_ID || '68a6c6cf0032a4edff19'}.documents`;
      
      console.log('🎯 Testing channel:', chatChannel);
      
      const unsubscribe = client.subscribe(
        chatChannel, // Real chat channel instead of 'files'
        (response) => {
          clearTimeout(timeout);
          console.log('✅ Chat channel connection successful!', response);
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
          resolve({ success: true, response, channel: chatChannel });
        },
        (error) => {
          clearTimeout(timeout);
          console.error('❌ Chat channel connection failed:', error);
          resolve({ success: false, error: error.message, channel: chatChannel });
        }
      );
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('❌ Connection setup failed:', error);
      resolve({ success: false, error: error.message });
    }
  });
};

// Test WebSocket support
export const testWebSocketSupport = () => {
  console.log('🌐 Testing WebSocket support...');
  
  if (typeof WebSocket === 'undefined') {
    console.error('❌ WebSocket not supported in this environment');
    return false;
  }
  
  if (typeof EventSource === 'undefined') {
    console.error('❌ EventSource not supported in this environment');
    return false;
  }
  
  console.log('✅ WebSocket and EventSource supported');
  return true;
};

// Test network connectivity
export const testNetworkConnectivity = async () => {
  console.log('🌍 Testing network connectivity...');
  
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (response.ok) {
      console.log('✅ Appwrite endpoint is reachable');
      return true;
    } else {
      console.error('❌ Appwrite endpoint returned:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error);
    return false;
  }
};
