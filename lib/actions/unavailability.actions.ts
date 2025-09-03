"use server";

import { ID, Query } from "node-appwrite";
import { databases, DATABASE_ID, DOCTOR_UNAVAILABILITY_COLLECTION_ID } from "@/lib/appwrite.config";
import { UnavailableSlot } from "@/constants";

// Create unavailability record
export const createUnavailability = async (params: {
  doctorName: string;
  slot: UnavailableSlot;
  createdBy: string;
}) => {
  try {
    const { doctorName, slot, createdBy } = params;
    
    const unavailabilityData = {
      doctorName,
      unavailableDate: slot.date,
      startTime: slot.startTime || null,
      endTime: slot.endTime || null,
      isAllDay: slot.isAllDay || false,
      reason: slot.reason || null,
      createdAt: new Date(),
      createdBy
    };

    const newUnavailability = await databases.createDocument(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID,
      ID.unique(),
      unavailabilityData
    );

    return newUnavailability;
  } catch (error) {
    console.error("Error creating unavailability:", error);
    throw error;
  }
};

// Get unavailability slots for a doctor
export const getUnavailabilitySlots = async (doctorName: string): Promise<UnavailableSlot[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID,
      [
        Query.equal("doctorName", doctorName),
        Query.orderDesc("createdAt")
      ]
    );

    // Convert Appwrite documents to UnavailableSlot format
    const slots: UnavailableSlot[] = response.documents.map((doc: any) => ({
      date: new Date(doc.unavailableDate),
      startTime: doc.startTime,
      endTime: doc.endTime,
      isAllDay: doc.isAllDay,
      reason: doc.reason,
    }));

    return slots;
  } catch (error) {
    console.error("Error getting unavailability slots:", error);
    return [];
  }
};

// Get all unavailability data
export const getAllUnavailabilityData = async (): Promise<Record<string, UnavailableSlot[]>> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID,
      [Query.orderDesc("createdAt")]
    );

    const unavailabilityData: Record<string, UnavailableSlot[]> = {};

    response.documents.forEach((doc: any) => {
      const doctorName = doc.doctorName;
      const slot: UnavailableSlot = {
        date: new Date(doc.unavailableDate),
        startTime: doc.startTime,
        endTime: doc.endTime,
        isAllDay: doc.isAllDay,
        reason: doc.reason,
      };

      if (!unavailabilityData[doctorName]) {
        unavailabilityData[doctorName] = [];
      }
      unavailabilityData[doctorName].push(slot);
    });

    return unavailabilityData;
  } catch (error) {
    console.error("Error getting all unavailability data:", error);
    return {};
  }
};

// Delete expired unavailability slots
export const cleanupExpiredUnavailability = async (): Promise<{
  cleaned: Array<{doctorName: string; slot: UnavailableSlot}>;
  updatedDoctors: string[];
}> => {
  try {
    const now = new Date();
    const cleaned: Array<{doctorName: string; slot: UnavailableSlot}> = [];
    const updatedDoctors: string[] = [];

    // Get all unavailability records
    const response = await databases.listDocuments(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID
    );

    // Check each record for expiration
    for (const doc of response.documents) {
      const slotDate = new Date(doc.unavailableDate);
      let isExpired = false;
      
      if (doc.isAllDay) {
        // For all-day unavailability, check if the date has passed
        const slotEndOfDay = new Date(slotDate);
        slotEndOfDay.setHours(23, 59, 59, 999);
        isExpired = now > slotEndOfDay;
      } else if (doc.endTime) {
        // For time-specific unavailability, check if end time has passed
        const [hours, minutes] = doc.endTime.split(':').map(Number);
        const slotEndDateTime = new Date(slotDate);
        slotEndDateTime.setHours(hours, minutes);
        isExpired = now > slotEndDateTime;
      }

      if (isExpired) {
        // Delete expired record
        await databases.deleteDocument(
          DATABASE_ID,
          DOCTOR_UNAVAILABILITY_COLLECTION_ID,
          doc.$id
        );

        const slot: UnavailableSlot = {
          date: new Date(doc.unavailableDate),
          startTime: doc.startTime,
          endTime: doc.endTime,
          isAllDay: doc.isAllDay,
          reason: doc.reason,
        };

        cleaned.push({ doctorName: doc.doctorName, slot });
        
        if (!updatedDoctors.includes(doc.doctorName)) {
          updatedDoctors.push(doc.doctorName);
        }

        console.log(`🗑️ Cleaned expired unavailability: Dr. ${doc.doctorName} - ${doc.reason || 'No reason'}`);
      }
    }

    return { cleaned, updatedDoctors };
  } catch (error) {
    console.error("Error cleaning up expired unavailability:", error);
    return { cleaned: [], updatedDoctors: [] };
  }
};

// Remove specific unavailability slot
export const removeUnavailabilitySlot = async (params: {
  doctorName: string;
  slot: UnavailableSlot;
}): Promise<boolean> => {
  try {
    const { doctorName, slot } = params;

    // Find the document by matching criteria
    const response = await databases.listDocuments(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID,
      [
        Query.equal("doctorName", doctorName),
        Query.equal("unavailableDate", slot.date.toISOString()),
        Query.equal("isAllDay", slot.isAllDay || false)
      ]
    );

    if (response.documents.length > 0) {
      const docToDelete = response.documents[0];
      
      // Additional checks for time-specific slots
      if (!slot.isAllDay && slot.startTime && slot.endTime) {
        const matchingDoc = response.documents.find(doc => 
          doc.startTime === slot.startTime && doc.endTime === slot.endTime
        );
        if (matchingDoc) {
          await databases.deleteDocument(
            DATABASE_ID,
            DOCTOR_UNAVAILABILITY_COLLECTION_ID,
            matchingDoc.$id
          );
          console.log(`Removed unavailability slot for Dr. ${doctorName}`);
          return true;
        }
      } else {
        // For all-day slots
        await databases.deleteDocument(
          DATABASE_ID,
          DOCTOR_UNAVAILABILITY_COLLECTION_ID,
          docToDelete.$id
        );
        console.log(`Removed unavailability slot for Dr. ${doctorName}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error removing unavailability slot:", error);
    return false;
  }
};

// Remove ALL unavailability records for a doctor (when toggling to Available)
export const removeAllUnavailabilityForDoctor = async (doctorName: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    // Get all unavailability records for this doctor
    const response = await databases.listDocuments(
      DATABASE_ID,
      DOCTOR_UNAVAILABILITY_COLLECTION_ID,
      [Query.equal("doctorName", doctorName)]
    );

    const deletedCount = response.documents.length;

    // Delete all records
    for (const doc of response.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        DOCTOR_UNAVAILABILITY_COLLECTION_ID,
        doc.$id
      );
    }

    console.log(`🗑️ Removed ${deletedCount} unavailability records for Dr. ${doctorName}`);
    
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error(`Error removing all unavailability for Dr. ${doctorName}:`, error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
