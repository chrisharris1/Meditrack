"use client";

import { client } from '@/lib/appwrite.client';

export const testAppwriteAuth = async () => {
  console.log('🔐 Testing Appwrite Authentication...');
  
  try {
    // Test if we can access the project
    const projectEndpoint = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/health`;
    console.log('🌐 Testing endpoint:', projectEndpoint);
    
    const healthResponse = await fetch(projectEndpoint);
    console.log('🏥 Health check status:', healthResponse.status);
    
    if (healthResponse.status === 200) {
      console.log('✅ Appwrite server is healthy');
    } else {
      console.error('❌ Appwrite server health check failed:', healthResponse.status);
    }
    
    // Test project access
    const projectEndpointTest = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`;
    console.log('🎯 Testing project access:', projectEndpointTest);
    
    const projectResponse = await fetch(projectEndpointTest, {
      headers: {
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_PROJECT_ID || '',
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📋 Project access status:', projectResponse.status);
    
    if (projectResponse.status === 401) {
      console.error('❌ Project ID is wrong or project doesn\'t exist');
      console.error('🔍 Check your NEXT_PUBLIC_PROJECT_ID in .env.local');
    }
    
    return {
      healthStatus: healthResponse.status,
      projectStatus: projectResponse.status,
      success: healthResponse.status === 200 && projectResponse.status !== 401
    };
    
  } catch (error: any) {
    console.error('❌ Auth test failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const diagnoseConnectionIssue = () => {
  console.log('🔍 DIAGNOSIS: Connection Issues');
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('- Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('- Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID);
  console.log('- Database ID:', process.env.NEXT_PUBLIC_DATABASE_ID);
  console.log('');
  
  // Check what's missing
  const missing = [];
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) missing.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  if (!process.env.NEXT_PUBLIC_PROJECT_ID) missing.push('NEXT_PUBLIC_PROJECT_ID');
  if (!process.env.NEXT_PUBLIC_DATABASE_ID) missing.push('NEXT_PUBLIC_DATABASE_ID');
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
  } else {
    console.log('✅ All environment variables present');
  }
  
  console.log('');
  console.log('🔧 SOLUTIONS:');
  console.log('');
  console.log('1. 📝 Verify Project ID in Appwrite Console:');
  console.log('   → Go to https://fra.cloud.appwrite.io/console');
  console.log('   → Select your project → Settings → Copy Project ID');
  console.log('   → Update NEXT_PUBLIC_PROJECT_ID in .env.local');
  console.log('');
  console.log('2. 🌍 Add Web Platform:');
  console.log('   → Appwrite Console → Settings → Platforms → Add Web Platform');
  console.log('   → Name: localhost');
  console.log('   → Hostname: localhost:3000');
  console.log('');
  console.log('3. 🔑 Check Database Permissions:');
  console.log('   → Database → Chat Collections → Settings → Permissions');
  console.log('   → Set Read/Create/Update/Delete = "any" or "users"');
  console.log('');
  console.log('4. 🔄 After changes: Restart your dev server (npm run dev)');
  console.log('');
};
