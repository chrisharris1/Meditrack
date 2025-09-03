"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

import { Doctors } from "@/constants";
import { formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";
import { SmartStatusBadge } from "../SmartStatusBadge";
import { AppointmentModal } from "../AppointmentModal";
import { PatientInfoDialog } from "../PatientInfoDialog";
import { Info } from "lucide-react";

export const columns: ColumnDef<Appointment>[] = [
  {
    header: "#",
    size: 60,
    cell: ({ row }) => {
      return <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }}>{row.index + 1}</span>;
    },
  },
  {
    accessorKey: "patient",
    header: "Patient",
    size: 200,
    cell: ({ row }) => {
      const appointment = row.original;
      // Safe access to patient name with fallbacks
      const patientName = appointment.patient?.name || 'Unknown Patient';
      const initials = patientName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      
      // Generate consistent color based on name
      const colors = [
        { bg: '#10B981', text: '#FFFFFF' }, // Green
        { bg: '#3B82F6', text: '#FFFFFF' }, // Blue  
        { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
        { bg: '#F59E0B', text: '#FFFFFF' }, // Yellow
        { bg: '#EF4444', text: '#FFFFFF' }, // Red
        { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
      ];
      // Compute a safe color index using a guarded patient name
      const safeName = (appointment.patient?.name || 'Unknown Patient').trim();
      const firstChar = safeName.charAt(0) || 'U';
      const colorIndex = firstChar.charCodeAt(0) % colors.length;
      const color = colors[colorIndex];
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            height: '32px',
            width: '32px', 
            borderRadius: '50%',
            backgroundColor: color.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: color.text
          }}>
            {initials}
          </div>
          <span style={{ 
            color: '#F9FAFB', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            {patientName}
          </span>

          <PatientInfoDialog
            patient={appointment.patient as any}
            appointment={appointment}
            trigger={
              <button
                type="button"
                aria-label="Patient info"
                title="Patient info"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  border: '1px solid #374151',
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <Info size={14} />
              </button>
            }
          />
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row }) => {
      const appointment = row.original;
      return (
        <div className="min-w-[115px]">
          <SmartStatusBadge status={appointment.status} appointmentId={appointment.$id} />
        </div>
      );
    },
  },
  {
    accessorKey: "schedule",
    header: "Date",
    size: 160,
    cell: ({ row }) => {
      const appointment = row.original;
      const formatted = formatDateTime(appointment.schedule);
      return (
        <span style={{ 
          color: '#9CA3AF', 
          fontSize: '14px',
          minWidth: '120px',
          display: 'block'
        }}>
          {formatted.dateTime}
        </span>
      );
    },
  },
  {
    accessorKey: "primaryPhysician",
    header: "Doctor",
    size: 180,
    cell: ({ row }) => {
      const appointment = row.original;

      const doctor = Doctors.find(
        (doctor) => doctor.name === appointment.primaryPhysician
      );
      

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src={doctor?.image!}
            alt="doctor"
            width={32}
            height={32}
            style={{
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <span style={{ 
            color: '#F9FAFB', 
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>
            Dr. {doctor?.name}
          </span>
        </div>
      );
    },
  },
  
{
    id: "actions",
    header: () => <span style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</span>,
    size: 250,
    cell: ({ row }) => {
      const appointment = row.original;

      return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <AppointmentModal
            key={`schedule-${appointment.$id}`}
            patientId={appointment.patient.$id}
            userId={appointment.userId}
            appointment={appointment}
            type="schedule"
            title="Schedule Appointment"
            description="Please confirm the following details to schedule."
          />
          <AppointmentModal
            key={`reschedule-${appointment.$id}`}
            patientId={appointment.patient.$id}
            userId={appointment.userId}
            appointment={appointment}
            type="reschedule"
            title="Reschedule Appointment"
            description="Add admin note and suggestions for rescheduling."
          />
          <AppointmentModal
            key={`cancel-${appointment.$id}`}
            patientId={appointment.patient.$id}
            userId={appointment.userId}
            appointment={appointment}
            type="cancel"
            title="Cancel Appointment"
            description="Are you sure you want to cancel your appointment?"
          />
        </div>
      );
    },
  },

];
