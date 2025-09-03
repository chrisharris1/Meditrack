"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { getRescheduledAppointmentsCount } from "@/lib/actions/reschedule.actions";

export const RescheduledCounter = () => {
  const [rescheduledCount, setRescheduledCount] = useState(0);

  useEffect(() => {
    // Function to calculate rescheduled count from database
    const calculateRescheduledCount = async () => {
      try {
        const count = await getRescheduledAppointmentsCount();
        setRescheduledCount(count);
        console.log(`📊 Rescheduled count updated: ${count}`);
      } catch (error) {
        console.error('Error calculating rescheduled count:', error);
        setRescheduledCount(0);
      }
    };

    // Calculate on mount
    calculateRescheduledCount();

    // Listen for custom events (for reschedule updates)
    const handleRescheduleUpdate = () => {
      calculateRescheduledCount();
    };

    window.addEventListener('rescheduleUpdated', handleRescheduleUpdate);

    return () => {
      window.removeEventListener('rescheduleUpdated', handleRescheduleUpdate);
    };
  }, []);

  return (
    <StatCard
      type="rescheduled"
      count={rescheduledCount}
      label="Total number of rescheduled appointments"
      icon="/assets/icons/pending.svg"
    />
  );
};
