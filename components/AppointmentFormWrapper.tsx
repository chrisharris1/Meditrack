"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppointmentForm from './forms/AppointmentForm';
import { Appointment } from '@/types/appwrite.types';
import { getRescheduleNotificationByAppointment } from '@/lib/actions/reschedule.actions';

interface AppointmentFormWrapperProps {
  patientId: string;
  userId: string;
}

export default function AppointmentFormWrapper({ patientId, userId }: AppointmentFormWrapperProps) {
  const [updateData, setUpdateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const isUpdateMode = searchParams?.get('update') === 'true';
  const appointmentId = searchParams?.get('appointmentId') || '';

  useEffect(() => {
    const loadUpdateData = async () => {
      if (isUpdateMode) {
        try {
          // First try to get from localStorage (temporary data from notification click)
          const storedData = localStorage.getItem('updateAppointmentData');
          if (storedData) {
            const appointmentData = JSON.parse(storedData);
            
            // Convert to appointment format
            const mockAppointment: Appointment = {
              $id: appointmentData.appointmentId,
              primaryPhysician: appointmentData.primaryPhysician,
              schedule: new Date(appointmentData.schedule),
              reason: appointmentData.reason || "Appointment rescheduling",
              note: appointmentData.note || "Updating appointment based on admin suggestions",
              status: "pending" as any,
              userId: appointmentData.userId,
              patient: {} as any,
              cancellationReason: null,
              adminNotes: appointmentData.adminNotes,
              $collectionId: '',
              $databaseId: '',
              $createdAt: '',
              $updatedAt: '',
              $permissions: []
            };
            
            setUpdateData(mockAppointment);
            
            // Clear the stored data after use
            localStorage.removeItem('updateAppointmentData');
          } else if (appointmentId) {
            // If no localStorage data but appointmentId in URL, try to get from database
            const notification = await getRescheduleNotificationByAppointment(appointmentId, userId);
            
            if (notification) {
              const mockAppointment: Appointment = {
                $id: notification.appointmentId,
                primaryPhysician: notification.doctorName,
                schedule: notification.scheduleTime,
                reason: notification.originalReason || "Appointment rescheduling",
                note: notification.originalNote || "Updating appointment based on admin suggestions",
                status: "pending" as any,
                userId: notification.userId,
                patient: {} as any,
                cancellationReason: null,
                adminNotes: notification.adminNotes,
                $collectionId: '',
                $databaseId: '',
                $createdAt: '',
                $updatedAt: '',
                $permissions: []
              };
              
              setUpdateData(mockAppointment);
            }
          }
        } catch (error) {
          console.error('Error loading update data:', error);
        }
      }
      setIsLoading(false);
    };

    loadUpdateData();
  }, [isUpdateMode, appointmentId, userId]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '200px',
        color: '#ABB8C4'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      width: '100%',
      minHeight: 'fit-content'
    }}>
      {isUpdateMode && updateData && (
        <div style={{
          backgroundColor: '#f59e0b20',
          border: '1px solid #f59e0b40',
          borderRadius: '12px',
          padding: '16px',
          flexShrink: 0
        }}>
          <h3 style={{
            color: '#f59e0b',
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 8px 0',
          }}>
            📝 Updating Appointment
          </h3>
          <p style={{
            color: '#ABB8C4',
            fontSize: '14px',
            margin: '0 0 8px 0',
            lineHeight: '1.4',
          }}>
            <strong>Admin Notes:</strong> {updateData.adminNotes}
          </p>
          <p style={{
            color: '#76828D',
            fontSize: '13px',
            margin: 0,
          }}>
            Please update your appointment time based on the admin suggestions above.
          </p>
        </div>
      )}
      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AppointmentForm
          patientId={patientId}
          userId={userId}
          type={isUpdateMode && updateData ? "reschedule" : "create"}
          appointment={updateData || undefined}
          isAdminReschedule={false}
        />
      </div>
    </div>
  );
}
