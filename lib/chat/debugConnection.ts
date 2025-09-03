"use client";

import { client } from '@/lib/appwrite.client';

export const testConnection = async () => {
  console.log('🔧 Debug: Testing Appwrite connection...');
  
  try {
    // Check client configuration
    console.log('🔧 Client config check:');
    console.log('- Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1');
    console.log('- Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID || '687666ef003bc3e7ba07');
    
    // Simple subscription test
    console.log('🔧 Starting simple subscription test...');
    
    const unsubscribe = client.subscribe(
      'files',
      (response) => {
        console.log('✅ Connection successful!', response);
      },
      (error) => {
        console.error('❌ Connection error:', error);
      }
    );
    
    // Cleanup after 3 seconds
    setTimeout(() => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        console.log('🔧 Test subscription cleaned up');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
};
