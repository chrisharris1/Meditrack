"use client";

import { useState } from "react";
import { DoctorAvailabilityDialog } from "./DoctorAvailabilityDialog";

export const DoctorAvailabilityButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(55, 65, 81, 0.3)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(75, 85, 99, 0.2)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(75, 85, 99, 0.4)';
          e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(55, 65, 81, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.2)';
          e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
        }}
      >
        {/* Subtle shine effect - matching other buttons */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          pointerEvents: 'none'
        }} />
        
        {/* Doctor icon */}
        <span style={{ fontSize: '16px' }}>👨‍⚕️</span>
        
        {/* Button text */}
        <span>Doctor Availability</span>
      </button>

      <DoctorAvailabilityDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
};
