"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Appointment } from "@/types/appwrite.types";

import { AppointmentForm } from "./forms/AppointmentForm";

import "react-datepicker/dist/react-datepicker.css";

export const AppointmentModal = ({
  patientId,
  userId,
  appointment,
  type,
  title,
  description,
}: {
  patientId: string;
  userId: string;
  appointment?: Appointment;
  type: "schedule" | "cancel" | "reschedule";
  title: string;
  description: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          style={{
            backgroundColor: 
              type === "schedule" ? "#10B981" :
              type === "reschedule" ? "#F59E0B" :
              "#EF4444", // cancel
            color: type === "reschedule" ? "#000000" : "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            textTransform: "capitalize",
            cursor: "pointer",
            transition: "all 0.2s ease",
            minWidth: "70px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {type}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="shad-dialog sm:max-w-md" 
        showCloseButton={false}
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#0D1117',
          border: '1px solid #30363D',
          borderRadius: '16px',
          padding: '32px',
          minWidth: type === 'reschedule' ? '600px' : '500px',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Custom styled close button */}
        <button
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#21262D',
            border: '1px solid #30363D',
            color: '#8B949E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = '#30363D';
            e.currentTarget.style.color = '#F0F6FC';
            e.currentTarget.style.borderColor = '#484F58';
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.background = '#21262D';
            e.currentTarget.style.color = '#8B949E';
            e.currentTarget.style.borderColor = '#30363D';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <DialogHeader className="mb-6 space-y-4">
          <DialogTitle 
            className="capitalize" 
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px',
              letterSpacing: '-0.025em'
            }}
          >
            {title}
          </DialogTitle>
          <DialogDescription
            style={{
              fontSize: '16px',
              color: '#8B949E',
              lineHeight: '1.5',
              marginTop: '8px'
            }}
          >
            {description}
          </DialogDescription>
        </DialogHeader>

        <AppointmentForm
          userId={userId}
          patientId={patientId}
          type={type}
          appointment={appointment}
          setOpen={setOpen}
          isAdminReschedule={type === "reschedule"}
        />
      </DialogContent>
    </Dialog>
  );
};