"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

import { Appointment } from "@/types/appwrite.types";

import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  messaging,
} from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";

//  CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      appointment
    );

    revalidatePath("/admin");
    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
  }
};

//  GET RECENT APPOINTMENTS
export const getRecentAppointmentList = async () => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [
        Query.select(['*', 'patient.*']), // expand patient relationship fields
        Query.orderDesc("$createdAt"),
      ]
    );

    const docs = appointments.documents as any[];
    const scheduledAppointments = docs.filter((a) => a.status === "scheduled");
    const pendingAppointments = docs.filter((a) => a.status === "pending");
        const cancelledAppointments = docs.filter((a) => a.status === "cancelled");

    // Since we can't use 'rescheduled' status in DB, we'll calculate it client-side
    // This will be 0 for now, but the client will update it with localStorage data
        const rescheduledAppointments: any[] = [];

    const data = {
     totalCount: appointments.total,
          scheduledCount: scheduledAppointments.length,
     pendingCount: pendingAppointments.length,
     cancelledCount: cancelledAppointments.length,
     rescheduledCount: rescheduledAppointments.length,
          documents: appointments.documents,
    };

    const initialCounts = {
    scheduledCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    };

        const counts = docs.reduce(
      (acc: any, a: any) => {
      switch (a.status) {
        case "scheduled":
          acc.scheduledCount++;
            break;
              case "pending":
            acc.pendingCount++;
          break;
      case "cancelled":
      acc.cancelledCount++;
    break;
    }
    return acc;
    },
    initialCounts
    );

    return parseStringify(data);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the recent appointments:",
      error
    );
  }
};

//  SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    // https://appwrite.io/docs/references/1.5.x/server-nodejs/messaging#createSms
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );
    return parseStringify(message);
  } catch (error) {
    console.error("An error occurred while sending sms:", error);
  }
};

//  UPDATE APPOINTMENT
export const updateAppointment = async ({
  appointmentId,
  userId,
  timeZone,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    console.log('Updating appointment with data:', {
      appointmentId,
      userId,
      type,
      appointment: {
        ...appointment,
        schedule: appointment.schedule?.toString(),
      }
    });
    
    // Update appointment to scheduled -> https://appwrite.io/docs/references/cloud/server-nodejs/databases#updateDocument
    // Temporarily exclude adminNotes from DB update to prevent potential schema issues
    const { adminNotes: _, ...appointmentData } = appointment;
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      appointmentData
    );
    
    console.log('Appointment updated successfully:', updatedAppointment);

    if (!updatedAppointment) throw Error;

    // Send SMS for schedule, cancel, and reschedule operations
    if (type === "schedule" || type === "cancel" || type === "reschedule") {
      let smsMessage = "";

      switch (type) {
        case "schedule":
          smsMessage = `Greetings from Meditrack. Your appointment is confirmed for ${formatDateTime(appointment.schedule!, timeZone).dateTime} with Dr. ${appointment.primaryPhysician}.`;
          break;
        case "cancel":
          smsMessage = `Greetings from Meditrack. We regret to inform that your appointment for ${formatDateTime(appointment.schedule!, timeZone).dateTime} is cancelled. Reason: ${appointment.cancellationReason || "Not specified"}.`;
          break;
        case "reschedule":
          // Admin notes come FIRST (what admin is suggesting)
          const adminNotes = appointment.adminNotes ? `\n\n${appointment.adminNotes}\n` : '\n';

          // Current appointment info for reference
          const currentAppointmentInfo = appointment.schedule ?
            `\nYour current appointment: ${formatDateTime(appointment.schedule, timeZone).dateTime} with Dr. ${appointment.primaryPhysician}\n` :
            '\n';

          // Call to action - patient must update themselves
          const callToAction = '\nPlease update your appointment through the patient portal with a new date/time that works for you.';

          smsMessage = `Greetings from Meditrack.${adminNotes}${currentAppointmentInfo}${callToAction}`;
          break;
      }

      if (smsMessage) {
        await sendSMSNotification(userId, smsMessage);
      }
    }

    // Force immediate revalidation
    revalidatePath("/admin");
    revalidatePath("/admin", "page");
    revalidatePath("/patients");
    
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("An error occurred while scheduling an appointment:", error);
  }
};

// GET APPOINTMENT
export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the existing patient:",
      error
    );
  }
};

// GET USER APPOINTMENTS WITH UNREAD NOTIFICATIONS
export const getUserAppointments = async (userId: string) => {
  try {
    const appointments = await databases.listDocuments(
    DATABASE_ID!,
    APPOINTMENT_COLLECTION_ID!,
    [
    Query.select(['*', 'patient.*']),
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt')
    ]
    );
    
    return parseStringify(appointments.documents);
  } catch (error) {
    console.error(
      "An error occurred while retrieving user appointments:",
      error
    );
  }
};

// MARK NOTIFICATION AS READ
export const markNotificationAsRead = async (appointmentId: string) => {
  try {
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      {
        notificationStatus: 'read'
      }
    );

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("An error occurred while marking notification as read:", error);
  }
};

