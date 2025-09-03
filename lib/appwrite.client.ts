"use client";

import { Client, Databases, Account } from "appwrite";

// Client-side Appwrite configuration
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID || '687666ef003bc3e7ba07');

// Export client-side services
export const databases = new Databases(client);
export const account = new Account(client);

// Export client for direct access
export { client };

// Export collection IDs for client-side use with fallbacks (standardized)
export const CLIENT_DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || process.env.DATABASE_ID || '687670ff00238795d9bf';
export const CLIENT_CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || process.env.CHAT_ROOMS_COLLECTION_ID || '68a6c4b600191431303b';
export const CLIENT_CHAT_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_MESSAGES_COLLECTION_ID || process.env.CHAT_MESSAGES_COLLECTION_ID || '68a6c62a0002fcf8e84e';
export const CLIENT_CHAT_PRESENCE_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_PRESENCE_COLLECTION_ID || process.env.CHAT_PRESENCE_COLLECTION_ID || '68a6c6cf0032a4edff19';
