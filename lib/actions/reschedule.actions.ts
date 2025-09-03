"use server";

import { ID, Query } from "node-appwrite";
import { databases, DATABASE_ID, RESCHEDULE_NOTIFICATIONS_COLLECTION_ID } from "@/lib/appwrite.config";

// Types for reschedule notifications
export interface RescheduleNotification {
  $id?: string;
  appointmentId: string;
  userId: string;
  adminNotes: string;
  isRead: boolean;
  doctorName: string;
  scheduleTime: Date;
  originalReason?: string;
  originalNote?: string;
  createdAt: Date;
  createdBy: string;
}

export interface CreateRescheduleNotificationParams {
  appointmentId: string;
  userId: string;
  adminNotes: string;
  doctorName: string;
  scheduleTime: Date;
  originalReason?: string;
  originalNote?: string;
  createdBy: string;
}

// Create a new reschedule notification
export const createRescheduleNotification = async (params: CreateRescheduleNotificationParams) => {
  try {
    const notificationData = {
      appointmentId: params.appointmentId,
      userId: params.userId,
      adminNotes: params.adminNotes,
      isRead: false,
      doctorName: params.doctorName,
      scheduleTime: params.scheduleTime,
      originalReason: params.originalReason || null,
      originalNote: params.originalNote || null,
      createdAt: new Date(),
      createdBy: params.createdBy
    };

    const notification = await databases.createDocument(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      notificationData
    );

    console.log(`✅ Created reschedule notification for appointment ${params.appointmentId}`);
    return notification;
  } catch (error) {
    console.error("Error creating reschedule notification:", error);
    throw error;
  }
};

// Get all reschedule notifications for a specific user
export const getUserRescheduleNotifications = async (userId: string): Promise<RescheduleNotification[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.orderDesc("createdAt")
      ]
    );

    const notifications: RescheduleNotification[] = response.documents.map((doc: any) => ({
      $id: doc.$id,
      appointmentId: doc.appointmentId,
      userId: doc.userId,
      adminNotes: doc.adminNotes,
      isRead: doc.isRead,
      doctorName: doc.doctorName,
      scheduleTime: new Date(doc.scheduleTime),
      originalReason: doc.originalReason,
      originalNote: doc.originalNote,
      createdAt: new Date(doc.createdAt),
      createdBy: doc.createdBy
    }));

    return notifications;
  } catch (error) {
    console.error("Error getting user reschedule notifications:", error);
    return [];
  }
};

// Get unread reschedule notifications for a specific user
export const getUnreadRescheduleNotifications = async (userId: string): Promise<RescheduleNotification[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
        Query.orderDesc("createdAt")
      ]
    );

    const notifications: RescheduleNotification[] = response.documents.map((doc: any) => ({
      $id: doc.$id,
      appointmentId: doc.appointmentId,
      userId: doc.userId,
      adminNotes: doc.adminNotes,
      isRead: doc.isRead,
      doctorName: doc.doctorName,
      scheduleTime: new Date(doc.scheduleTime),
      originalReason: doc.originalReason,
      originalNote: doc.originalNote,
      createdAt: new Date(doc.createdAt),
      createdBy: doc.createdBy
    }));

    return notifications;
  } catch (error) {
    console.error("Error getting unread reschedule notifications:", error);
    return [];
  }
};

// Mark a reschedule notification as read
export const markRescheduleNotificationAsRead = async (appointmentId: string, userId: string): Promise<boolean> => {
  try {
    // Find the notification by appointmentId and userId
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("appointmentId", appointmentId),
        Query.equal("userId", userId)
      ]
    );

    if (response.documents.length > 0) {
      const notification = response.documents[0];
      
      await databases.updateDocument(
        DATABASE_ID,
        RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
        notification.$id,
        { isRead: true }
      );

      console.log(`✅ Marked reschedule notification as read: ${appointmentId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error marking reschedule notification as read:", error);
    return false;
  }
};

// Delete a reschedule notification
export const deleteRescheduleNotification = async (appointmentId: string, userId?: string): Promise<boolean> => {
  try {
    const queries = [Query.equal("appointmentId", appointmentId)];
    if (userId) {
      queries.push(Query.equal("userId", userId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      queries
    );

    if (response.documents.length > 0) {
      // Delete all matching notifications
      for (const notification of response.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
          notification.$id
        );
      }

      console.log(`🗑️ Deleted reschedule notification(s) for appointment ${appointmentId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting reschedule notification:", error);
    return false;
  }
};

// Get total count of rescheduled appointments
export const getRescheduledAppointmentsCount = async (): Promise<number> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [Query.orderDesc("createdAt")]
    );

    // Count unique appointment IDs
    const uniqueAppointmentIds = new Set(response.documents.map(doc => doc.appointmentId));
    return uniqueAppointmentIds.size;
  } catch (error) {
    console.error("Error getting rescheduled appointments count:", error);
    return 0;
  }
};

// Check if an appointment has been rescheduled (for status badge)
export const checkAppointmentRescheduled = async (appointmentId: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("appointmentId", appointmentId),
        Query.limit(1)
      ]
    );

    return response.documents.length > 0;
  } catch (error) {
    console.error("Error checking appointment rescheduled status:", error);
    return false;
  }
};

// Get all reschedule notifications (for admin/debug purposes)
export const getAllRescheduleNotifications = async (): Promise<RescheduleNotification[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [Query.orderDesc("createdAt")]
    );

    const notifications: RescheduleNotification[] = response.documents.map((doc: any) => ({
      $id: doc.$id,
      appointmentId: doc.appointmentId,
      userId: doc.userId,
      adminNotes: doc.adminNotes,
      isRead: doc.isRead,
      doctorName: doc.doctorName,
      scheduleTime: new Date(doc.scheduleTime),
      originalReason: doc.originalReason,
      originalNote: doc.originalNote,
      createdAt: new Date(doc.createdAt),
      createdBy: doc.createdBy
    }));

    return notifications;
  } catch (error) {
    console.error("Error getting all reschedule notifications:", error);
    return [];
  }
};

// Clear all reschedule notifications (for testing/debug)
export const clearAllRescheduleNotifications = async (): Promise<number> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID
    );

    let deletedCount = 0;
    for (const notification of response.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
        notification.$id
      );
      deletedCount++;
    }

    console.log(`🧹 Cleared ${deletedCount} reschedule notifications`);
    return deletedCount;
  } catch (error) {
    console.error("Error clearing all reschedule notifications:", error);
    return 0;
  }
};

// Get reschedule notification by appointment ID (for form wrapper)
export const getRescheduleNotificationByAppointment = async (appointmentId: string, userId: string): Promise<RescheduleNotification | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESCHEDULE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("appointmentId", appointmentId),
        Query.equal("userId", userId),
        Query.limit(1)
      ]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        $id: doc.$id,
        appointmentId: doc.appointmentId,
        userId: doc.userId,
        adminNotes: doc.adminNotes,
        isRead: doc.isRead,
        doctorName: doc.doctorName,
        scheduleTime: new Date(doc.scheduleTime),
        originalReason: doc.originalReason,
        originalNote: doc.originalNote,
        createdAt: new Date(doc.createdAt),
        createdBy: doc.createdBy
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting reschedule notification by appointment:", error);
    return null;
  }
};
