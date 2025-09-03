"use server";

import { ID, Query } from "node-appwrite";
import { databases, DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, CHAT_MESSAGES_COLLECTION_ID, CHAT_PRESENCE_COLLECTION_ID } from "@/lib/appwrite.config";

// Types for chat system
export interface ChatRoom {
  $id?: string;
  roomId: string;
  patientId: string;
  patientName: string;
  adminId?: string;
  status: "pending" | "active" | "ended" | "denied";
  endedBy?: "admin" | "patient";
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  $id?: string;
  roomId: string;
  messageText: string;
  senderRole: "admin" | "patient" | "system";
  senderName: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatPresence {
  $id?: string;
  userId: string;
  role: "admin" | "patient";
  isOnline: boolean;
  lastSeen: Date;
  currentRoomId?: string;
  isTyping?: boolean;
}

// ===== CHAT ROOM OPERATIONS =====

// Create a new chat room
export const createChatRoom = async (params: {
  roomId: string;
  patientId: string;
  patientName: string;
}): Promise<ChatRoom | null> => {
  try {
    const roomData = {
      roomId: params.roomId,
      patientId: params.patientId,
      patientName: params.patientName,
      adminId: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const room = await databases.createDocument(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      ID.unique(),
      roomData
    );

    console.log(`✅ Created chat room: ${params.roomId}`);
    return room as any;
  } catch (error) {
    console.error("Error creating chat room:", error);
    return null;
  }
};

// Get chat room by roomId
export const getChatRoom = async (roomId: string): Promise<ChatRoom | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [Query.equal("roomId", roomId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        $id: doc.$id,
        roomId: doc.roomId,
        patientId: doc.patientId,
        patientName: doc.patientName,
        adminId: doc.adminId,
        status: doc.status,
        endedBy: doc.endedBy,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting chat room:", error);
    return null;
  }
};

// Update chat room status
export const updateChatRoomStatus = async (
  roomId: string, 
  status: "pending" | "active" | "ended" | "denied",
  adminId?: string
): Promise<boolean> => {
  try {
    console.log(`🔍 updateChatRoomStatus: Searching for room with roomId: ${roomId}`);
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [Query.equal("roomId", roomId), Query.limit(1)]
    );

    console.log(`📊 updateChatRoomStatus: Found ${response.documents.length} documents`);
    if (response.documents.length > 0) {
      const room = response.documents[0];
      console.log(`📄 updateChatRoomStatus: Room document:`, room);
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (adminId) {
        updateData.adminId = adminId;
      }

      console.log(`💾 updateChatRoomStatus: Updating document ${room.$id} with data:`, updateData);
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        room.$id,
        updateData
      );

      console.log(`✅ Updated chat room ${roomId} status to ${status}`);
      return true;
    }

    console.error(`❌ updateChatRoomStatus: No room found with roomId: ${roomId}`);
    return false;
  } catch (error) {
    console.error("❌ Error updating chat room status:", error);
    return false;
  }
};

// Get pending chat rooms
export const getPendingChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [
        Query.equal("status", "pending"),
        Query.orderDesc("createdAt")
      ]
    );

    return response.documents.map((doc: any) => ({
      $id: doc.$id,
      roomId: doc.roomId,
      patientId: doc.patientId,
      patientName: doc.patientName,
      adminId: doc.adminId,
      status: doc.status,
      endedBy: doc.endedBy,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    }));
  } catch (error) {
    console.error("Error getting pending chat rooms:", error);
    return [];
  }
};

// Get active chat rooms
export const getActiveChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [
        Query.equal("status", "active"),
        Query.orderDesc("updatedAt")
      ]
    );

    return response.documents.map((doc: any) => ({
      $id: doc.$id,
      roomId: doc.roomId,
      patientId: doc.patientId,
      patientName: doc.patientName,
      adminId: doc.adminId,
      status: doc.status,
      endedBy: doc.endedBy,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    }));
  } catch (error) {
    console.error("Error getting active chat rooms:", error);
    return [];
  }
};

// ===== CHAT MESSAGE OPERATIONS =====

// Send a message
export const sendChatMessage = async (params: {
  roomId: string;
  messageText: string;
  senderRole: "admin" | "patient" | "system";
  senderName: string;
}): Promise<ChatMessage | null> => {
  try {
    const messageData = {
      roomId: params.roomId,
      messageText: params.messageText,
      senderRole: params.senderRole,
      senderName: params.senderName,
      timestamp: new Date(),
      isRead: false
    };

    const message = await databases.createDocument(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      ID.unique(),
      messageData
    );

    // Update room's updatedAt timestamp
    await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [Query.equal("roomId", params.roomId), Query.limit(1)]
    ).then(async (response) => {
      if (response.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          response.documents[0].$id,
          { updatedAt: new Date() }
        );
      }
    });

    console.log(`✅ Sent message to room ${params.roomId}`);
    return message as any;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return null;
  }
};

// Get messages for a room
export const getChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      [
        Query.equal("roomId", roomId),
        Query.orderAsc("timestamp")
      ]
    );

    return response.documents.map((doc: any) => ({
      $id: doc.$id,
      roomId: doc.roomId,
      messageText: doc.messageText,
      senderRole: doc.senderRole,
      senderName: doc.senderName,
      timestamp: new Date(doc.timestamp),
      isRead: doc.isRead
    }));
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return [];
  }
};

// Mark messages as read
export const markMessagesAsRead = async (roomId: string, userRole: "admin" | "patient"): Promise<boolean> => {
  try {
    // Get unread messages for the opposite role
    const targetRole = userRole === "admin" ? "patient" : "admin";
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      [
        Query.equal("roomId", roomId),
        Query.equal("senderRole", targetRole),
        Query.equal("isRead", false)
      ]
    );

    // Update all unread messages
    for (const message of response.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        message.$id,
        { isRead: true }
      );
    }

    console.log(`✅ Marked ${response.documents.length} messages as read in room ${roomId}`);
    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
};

// Get unread message count for a room
export const getUnreadMessageCount = async (roomId: string, userRole: "admin" | "patient"): Promise<number> => {
  try {
    // Count messages from the opposite role that are unread
    const targetRole = userRole === "admin" ? "patient" : "admin";
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      [
        Query.equal("roomId", roomId),
        Query.equal("senderRole", targetRole),
        Query.equal("isRead", false)
      ]
    );

    return response.documents.length;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    return 0;
  }
};

// ===== PRESENCE OPERATIONS =====

// Update user presence
export const updateUserPresence = async (params: {
  userId: string;
  role: "admin" | "patient";
  isOnline: boolean;
  currentRoomId?: string;
  isTyping?: boolean;
}): Promise<boolean> => {
  try {
    // Check if presence record exists
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_PRESENCE_COLLECTION_ID,
      [Query.equal("userId", params.userId), Query.limit(1)]
    );

    const presenceData: any = {
      userId: params.userId,
      role: params.role,
      isOnline: params.isOnline,
      lastSeen: new Date(),
      currentRoomId: params.currentRoomId || null
    };

    // Add typing status if provided
    if (params.isTyping !== undefined) {
      presenceData.isTyping = params.isTyping;
    }

    if (response.documents.length > 0) {
      // Update existing presence
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_PRESENCE_COLLECTION_ID,
        response.documents[0].$id,
        presenceData
      );
    } else {
      // Create new presence record
      await databases.createDocument(
        DATABASE_ID,
        CHAT_PRESENCE_COLLECTION_ID,
        ID.unique(),
        { ...presenceData, isTyping: false }
      );
    }

    console.log(`✅ Updated presence for ${params.role} ${params.userId}: ${params.isOnline ? 'online' : 'offline'}${params.isTyping !== undefined ? `, typing: ${params.isTyping}` : ''}`);
    return true;
  } catch (error) {
    console.error("Error updating user presence:", error);
    return false;
  }
};

// Check if admin is online
export const isAdminOnline = async (): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_PRESENCE_COLLECTION_ID,
      [
        Query.equal("role", "admin"),
        Query.equal("isOnline", true),
        Query.limit(1)
      ]
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking admin online status:", error);
    return false;
  }
};

// Get online users
export const getOnlineUsers = async (role?: "admin" | "patient"): Promise<ChatPresence[]> => {
  try {
    const queries = [Query.equal("isOnline", true)];
    if (role) {
      queries.push(Query.equal("role", role));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_PRESENCE_COLLECTION_ID,
      queries
    );

    return response.documents.map((doc: any) => ({
      $id: doc.$id,
      userId: doc.userId,
      role: doc.role,
      isOnline: doc.isOnline,
      lastSeen: new Date(doc.lastSeen),
      currentRoomId: doc.currentRoomId,
      isTyping: doc.isTyping || false
    }));
  } catch (error) {
    console.error("Error getting online users:", error);
    return [];
  }
};

// ===== ADMIN OPERATIONS =====

// Approve chat request
export const approveChatRequest = async (roomId: string, adminId: string): Promise<boolean> => {
  try {
    console.log(`🔄 approveChatRequest: Updating room ${roomId} to active status`);
    const success = await updateChatRoomStatus(roomId, "active", adminId);
    if (success) {
      console.log(`✅ Approved chat request for room ${roomId}`);
    } else {
      console.error(`❌ Failed to approve chat request for room ${roomId}`);
    }
    return success;
  } catch (error) {
    console.error("❌ Error approving chat request:", error);
    return false;
  }
};

// Deny chat request
export const denyChatRequest = async (roomId: string): Promise<boolean> => {
  try {
    const success = await updateChatRoomStatus(roomId, "denied");
    if (success) {
      console.log(`✅ Denied chat request for room ${roomId}`);
    }
    return success;
  } catch (error) {
    console.error("Error denying chat request:", error);
    return false;
  }
};

// End chat session
export const endChatSession = async (roomId: string): Promise<boolean> => {
  try {
    // Get the current room to preserve existing data
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [Query.equal("roomId", roomId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const room = response.documents[0];
      const updateData: any = {
        status: "ended",
        updatedAt: new Date()
      };

      // Note: endedBy field is not in Appwrite schema, so we don't include it
      // The real-time subscription will handle the "ended" status appropriately

      await databases.updateDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        room.$id,
        updateData
      );

      console.log(`✅ Ended chat session for room ${roomId}`);
      return true;
    }

    console.error(`❌ Room ${roomId} not found`);
    return false;
  } catch (error) {
    console.error("Error ending chat session:", error);
    return false;
  }
};

// Smart cleanup: Delete denied rooms completely, archive ended rooms (keep chat history)
export const cleanupChatRoom = async (roomId: string): Promise<boolean> => {
  try {
    console.log(`🧹 Processing cleanup for chat room ${roomId}`);
    
    // Find the room
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [Query.equal("roomId", roomId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const room = response.documents[0];
      console.log(`Found room ${roomId} with status: ${room.status}`);
      
      if (room.status === "denied") {
        // DENIED: Delete everything (no valid conversation happened)
        console.log(`🗑️ Deleting denied room ${roomId} and all messages`);
        
        // Delete associated messages
        const messages = await databases.listDocuments(
          DATABASE_ID,
          CHAT_MESSAGES_COLLECTION_ID,
          [Query.equal("roomId", roomId)]
        );

        for (const message of messages.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            CHAT_MESSAGES_COLLECTION_ID,
            message.$id
          );
        }

        // Delete the room
        await databases.deleteDocument(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          room.$id
        );

        console.log(`✅ Completely deleted denied room ${roomId}`);
        return true;
        
      } else if (room.status === "ended") {
        // ENDED: Keep messages for history, only delete room record
        console.log(`📚 Archiving ended room ${roomId} - keeping chat history`);
        
        // Only delete the room record, keep messages for patient history
        await databases.deleteDocument(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          room.$id
        );

        console.log(`✅ Archived ended room ${roomId} - messages preserved for history`);
        return true;
        
      } else {
        console.log(`⚠️ Room ${roomId} status is ${room.status}, not processing cleanup`);
        return false;
      }
    }

    console.log(`⚠️ Room ${roomId} not found`);
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning up chat room ${roomId}:`, error);
    return false;
  }
};

// ===== UTILITY OPERATIONS =====

// Clean up old chat rooms (older than 24 hours and ended/denied)
export const cleanupOldChatRooms = async (): Promise<number> => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [
        Query.lessThan("updatedAt", oneDayAgo.toISOString()),
        Query.or([
          Query.equal("status", "ended"),
          Query.equal("status", "denied")
        ])
      ]
    );

    let deletedCount = 0;
    for (const room of response.documents) {
      // Delete associated messages first
      const messages = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [Query.equal("roomId", room.roomId)]
      );

      for (const message of messages.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          CHAT_MESSAGES_COLLECTION_ID,
          message.$id
        );
      }

      // Delete the room
      await databases.deleteDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        room.$id
      );

      deletedCount++;
    }

    console.log(`🧹 Cleaned up ${deletedCount} old chat rooms`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up old chat rooms:", error);
    return 0;
  }
};

// Clean up offline presence records (older than 30 minutes)
export const cleanupOfflinePresence = async (): Promise<number> => {
  try {
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const response = await databases.listDocuments(
      DATABASE_ID,
      CHAT_PRESENCE_COLLECTION_ID,
      [
        Query.equal("isOnline", false),
        Query.lessThan("lastSeen", thirtyMinutesAgo.toISOString())
      ]
    );

    let deletedCount = 0;
    for (const presence of response.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        CHAT_PRESENCE_COLLECTION_ID,
        presence.$id
      );
      deletedCount++;
    }

    console.log(`🧹 Cleaned up ${deletedCount} offline presence records`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up offline presence:", error);
    return 0;
  }
};

// Debug function - get all chat data
export const getAllChatData = async () => {
  try {
    const rooms = await databases.listDocuments(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID);
    const messages = await databases.listDocuments(DATABASE_ID, CHAT_MESSAGES_COLLECTION_ID);
    const presence = await databases.listDocuments(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID);

    return {
      rooms: rooms.documents,
      messages: messages.documents,
      presence: presence.documents,
      counts: {
        totalRooms: rooms.documents.length,
        totalMessages: messages.documents.length,
        onlineUsers: presence.documents.filter(p => p.isOnline).length
      }
    };
  } catch (error) {
    console.error("Error getting chat debug data:", error);
    return null;
  }
};
