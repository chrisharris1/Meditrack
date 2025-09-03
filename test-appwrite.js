const { Client, Databases } = require('appwrite');

// Test Appwrite connection
const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID || '687666ef003bc3e7ba07');

const databases = new Databases(client);

async function testConnection() {
  try {
    console.log('Testing Appwrite connection...');
    console.log('Endpoint:', process.env.NEXT_PUBLIC_ENDPOINT || 'https://cloud.appwrite.io/v1');
    console.log('Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID || '687666ef003bc3e7ba07');
    
    // Test database connection by listing documents from a collection
    const result = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID || '687670ff00238795d9bf',
      process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || '68a6c4b600191431303b'
    );
    
    console.log('✅ Connection successful!');
    console.log('Chat rooms found:', result.documents.length);
    if (result.documents.length > 0) {
      console.log('Sample room:', result.documents[0]);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
