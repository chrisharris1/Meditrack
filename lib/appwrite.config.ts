import * as sdk from "node-appwrite";
import { config } from 'dotenv';

// Load environment variables as fallback
if (typeof window === 'undefined') {
  config({ path: '.env.local' });
}

// Extract environment variables with fallback values
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.PROJECT_ID || '687666ef003bc3e7ba07';
const API_KEY = process.env.API_KEY || 'standard_cb5d99254462fa1f3db7ca6e15e6cbc4f225c250f7c7f9cb4c37dbc5a4d581db6464aafe9979ecfc5d528d4b5c7a7675b08c1c86d52bcf39b2453d73b476793667c1d564b08dab2cc6bd26226ea2e7041f1ef2274241cd3bd50110d4bee718f35620f950b1592321010e9481e89d1690a3fb7963b6383f28706049a85823a2eb';
const DATABASE_ID = process.env.DATABASE_ID || '687670ff00238795d9bf';
const PATIENT_COLLECTION_ID = process.env.PATIENT_COLLECTION_ID || '6876719b001ed709da5b';
const DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID || '687672380022afcf6d2e';
const APPOINTMENT_COLLECTION_ID = process.env.APPOINTMENT_COLLECTION_ID || '6876729a003a5249a703';
const DOCTOR_UNAVAILABILITY_COLLECTION_ID = process.env.DOCTOR_UNAVAILABILITY_COLLECTION_ID || '68a630aa0005128f0eae';
const RESCHEDULE_NOTIFICATIONS_COLLECTION_ID = process.env.RESCHEDULE_NOTIFICATIONS_COLLECTION_ID || '68a640b300388736a45';
const CHAT_ROOMS_COLLECTION_ID = process.env.CHAT_ROOMS_COLLECTION_ID || '68a6c4b600191431303b';
const CHAT_MESSAGES_COLLECTION_ID = process.env.CHAT_MESSAGES_COLLECTION_ID || '68a6c62a0002fcf8e84e';
const CHAT_PRESENCE_COLLECTION_ID = process.env.CHAT_PRESENCE_COLLECTION_ID || '68a6c6cf0032a4edff19';
const BUCKET_ID = process.env.NEXT_PUBLIC_BUCKET_ID || '68767334002535e20dcf';

// Runtime check
if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  throw new Error(
    "❌ Missing required Appwrite environment variables. Please check your .env.local file."
  );
}

// Initialize the client
const client = new sdk.Client();

client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

// Export Appwrite services
export const databases = new sdk.Databases(client);
export const users = new sdk.Users(client);
export const messaging = new sdk.Messaging(client);
export const storage = new sdk.Storage(client);

// Export constants if needed elsewhere
export {
  ENDPOINT,
  PROJECT_ID,
  DATABASE_ID,
  PATIENT_COLLECTION_ID,
  DOCTOR_COLLECTION_ID,
  APPOINTMENT_COLLECTION_ID,
  DOCTOR_UNAVAILABILITY_COLLECTION_ID,
  RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
  CHAT_ROOMS_COLLECTION_ID,
  CHAT_MESSAGES_COLLECTION_ID,
  CHAT_PRESENCE_COLLECTION_ID,
  BUCKET_ID,
};
