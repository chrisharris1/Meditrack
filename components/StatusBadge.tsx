import clsx from "clsx";
import Image from "next/image";

import { StatusIcons, AppointmentStatus } from "@/constants";

export const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "scheduled":
        return {
          bg: "#10B981",
          text: "#FFFFFF",
          dotColor: "#FFFFFF",
          label: "Scheduled"
        };
      case "pending":
        return {
          bg: "#3B82F6", 
          text: "#FFFFFF",
          dotColor: "#FFFFFF",
          label: "Pending"
        };
      case "cancelled":
        return {
          bg: "#EF4444",
          text: "#FFFFFF", 
          dotColor: "#FFFFFF",
          label: "Cancelled"
        };
      case "rescheduled":
        return {
          bg: "#F59E0B",
          text: "#FFFFFF",
          dotColor: "#FFFFFF", 
          label: "Rescheduled"
        };
      default:
        return {
          bg: "#6B7280",
          text: "#FFFFFF",
          
          dotColor: "#FFFFFF",
          label: status
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '4px',
      paddingBottom: '4px',
      borderRadius: '16px',
      backgroundColor: config.bg,
      fontSize: '12px',
      fontWeight: '500',
      color: config.text,
      gap: '6px',
      minWidth: '80px',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '6px',
        height: '6px', 
        borderRadius: '50%',
        backgroundColor: config.dotColor
      }} />
      <span>
        {config.label}
      </span>
    </div>
  );
};
