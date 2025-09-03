"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { AppointmentStatus } from "@/constants";
import { checkAppointmentRescheduled } from "@/lib/actions/reschedule.actions";

interface SmartStatusBadgeProps {
  status: AppointmentStatus;
  appointmentId: string;
}

export const SmartStatusBadge = ({ status, appointmentId }: SmartStatusBadgeProps) => {
  const [displayStatus, setDisplayStatus] = useState<AppointmentStatus>(status);

  useEffect(() => {
    const checkRescheduleStatus = async () => {
      // Check if this appointment has been rescheduled by admin (stored in database)
      if (status === "pending") {
        try {
          const isRescheduled = await checkAppointmentRescheduled(appointmentId);
          
          if (isRescheduled) {
            setDisplayStatus("rescheduled");
          } else {
            setDisplayStatus(status);
          }
        } catch (error) {
          console.error('Error checking reschedule status:', error);
          setDisplayStatus(status);
        }
      } else {
        setDisplayStatus(status);
      }
    };

    // Check status on mount
    checkRescheduleStatus();

    // Listen for reschedule updates
    const handleRescheduleUpdate = () => {
      checkRescheduleStatus();
    };

    window.addEventListener('rescheduleUpdated', handleRescheduleUpdate);

    return () => {
      window.removeEventListener('rescheduleUpdated', handleRescheduleUpdate);
    };
  }, [status, appointmentId]);

  return <StatusBadge status={displayStatus} />;
};
