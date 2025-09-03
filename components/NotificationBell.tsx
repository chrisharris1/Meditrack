"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Appointment } from "@/types/appwrite.types";
import { AppointmentModal } from "./AppointmentModal";
import { getUnreadRescheduleNotifications, markRescheduleNotificationAsRead } from "@/lib/actions/reschedule.actions";

interface NotificationBellProps {
  userId: string;
  patientId: string;
}

export const NotificationBell = ({ userId, patientId }: NotificationBellProps) => {
  const [unreadNotifications, setUnreadNotifications] = useState<Appointment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Get notifications from database
        const notifications = await getUnreadRescheduleNotifications(userId);
        
        console.log('Fetched unread notifications from database:', notifications);
        
        // Convert to appointment-like objects for display
        const notificationAppointments = notifications.map((notif) => ({
          $id: notif.appointmentId,
          primaryPhysician: notif.doctorName,
          adminNotes: notif.adminNotes,
          schedule: notif.scheduleTime,
          status: 'rescheduled' as any,
          timestamp: notif.createdAt,
          // Include original appointment data
          reason: notif.originalReason,
          note: notif.originalNote,
          // Add required Appointment fields
          patient: {} as any,
          userId: notif.userId,
          cancellationReason: null,
          $collectionId: '',
          $databaseId: '',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        } as Appointment));
        
        setUnreadNotifications(notificationAppointments);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setUnreadNotifications([]);
      }
    };

    fetchNotifications();
    
    // Refresh every 5 seconds to detect new notifications
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleNotificationClick = (appointment: Appointment) => {
    // Don't mark as read yet - just show the dialog
    setSelectedAppointment(appointment);
    setIsOpen(true);
    setShowNotifications(false);
  };

  const handleUserAction = async (appointmentId: string) => {
    try {
      // Mark as read in database when user takes action
      await markRescheduleNotificationAsRead(appointmentId, userId);
      console.log(`✅ Marked notification as read in database: ${appointmentId}`);
      
      // Dispatch event to refresh notification components
      window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
    
    // Remove from unread list
    setUnreadNotifications(prev => prev.filter(apt => apt.$id !== appointmentId));
    
    // Close dialog
    setIsOpen(false);
    setSelectedAppointment(null);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={toggleNotifications}
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#ABB8C4',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#24AE7C'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#ABB8C4'}
        >
          <Bell size={24} />
          {unreadNotifications.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0D0F10',
              }}
            >
              {unreadNotifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              backgroundColor: '#1A1D21',
              border: '1px solid #363A3D',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '320px',
              maxWidth: '400px',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
            }}
          >
            <h3
              style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 12px 0',
              }}
            >
              Reschedule Notifications
            </h3>

            {unreadNotifications.length === 0 ? (
              <p
                style={{
                  color: '#76828D',
                  fontSize: '14px',
                  margin: 0,
                  textAlign: 'center',
                  padding: '12px 0',
                }}
              >
                No new notifications
              </p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {unreadNotifications.map((appointment) => (
                  <div
                    key={appointment.$id}
                    onClick={() => handleNotificationClick(appointment)}
                    style={{
                      backgroundColor: '#24AE7C20',
                      border: '1px solid #24AE7C40',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#24AE7C30';
                      (e.target as HTMLElement).style.borderColor = '#24AE7C';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = '#24AE7C20';
                      (e.target as HTMLElement).style.borderColor = '#24AE7C40';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                        }}
                      >
                        Dr. {appointment.primaryPhysician}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '500',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p
                      style={{
                        color: '#ABB8C4',
                        fontSize: '12px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4',
                      }}
                    >
                      {appointment.adminNotes}
                    </p>
                    
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          color: '#76828D',
                          fontSize: '11px',
                        }}
                      >
                        {new Date(appointment.schedule).toLocaleDateString()} at{' '}
                        {new Date(appointment.schedule).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      
                      <span
                        style={{
                          color: '#24AE7C',
                          fontSize: '11px',
                          fontWeight: '500',
                        }}
                      >
                        Click to update →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appointment Update Dialog */}
      {selectedAppointment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: isOpen ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1A1D21',
              border: '1px solid #363A3D',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '95%',
              maxHeight: '85vh',
              minHeight: '500px',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #363A3D',
              }}
            >
              <h2
                style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                Appointment Update Required
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: '#24AE7C',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s',
                  marginLeft: '16px',
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#1E9A66'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#24AE7C'}
              >
                ×
              </button>
            </div>

            {/* Doctor Info */}
            <div
              style={{
                backgroundColor: '#24AE7C15',
                border: '1px solid #24AE7C30',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h3
                  style={{
                    color: '#24AE7C',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                  }}
                >
                  Dr. {selectedAppointment.primaryPhysician}
                </h3>
                <span
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
              <p
                style={{
                  color: '#ABB8C4',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                Original appointment: {new Date(selectedAppointment.schedule).toLocaleDateString()} at{' '}
                {new Date(selectedAppointment.schedule).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Admin Notes */}
            <div
              style={{
                backgroundColor: '#2D3748',
                border: '1px solid #4A5568',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <h4
                style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                }}
              >
                Admin Notes & Suggestions:
              </h4>
              <p
                style={{
                  color: '#E2E8F0',
                  fontSize: '14px',
                  margin: 0,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedAppointment.adminNotes}
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: '#374151',
                  border: '1px solid #6B7280',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: '#E5E7EB',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#4B5563';
                  (e.target as HTMLElement).style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#374151';
                  (e.target as HTMLElement).style.borderColor = '#6B7280';
                }}
              >
                I'll Call Later
              </button>
              <button
                onClick={() => {
                  // Store the appointment data temporarily for the update form
                  const appointmentData = {
                    appointmentId: selectedAppointment.$id,
                    primaryPhysician: selectedAppointment.primaryPhysician,
                    schedule: selectedAppointment.schedule,
                    adminNotes: selectedAppointment.adminNotes,
                    userId: userId,
                    // Include original appointment reason and notes if available
                    reason: selectedAppointment.reason || null,
                    note: selectedAppointment.note || null,
                  };
                  localStorage.setItem('updateAppointmentData', JSON.stringify(appointmentData));
                  
                  // Mark notification as handled
                  handleUserAction(selectedAppointment.$id);
                  
                  // Close modal first, then navigate
                  setIsOpen(false);
                  setSelectedAppointment(null);
                  setShowNotifications(false);
                  
                  // Navigate after a short delay to ensure modal is closed
                  setTimeout(() => {
                    window.location.href = `/patients/${userId}/new-appointment?update=true`;
                  }, 100);
                }}
                style={{
                  backgroundColor: '#f59e0b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#d97706'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#f59e0b'}
              >
                Update Appointment
              </button>
              <button
                onClick={() => {
                  // Mark notification as handled
                  handleUserAction(selectedAppointment.$id);
                  
                  // Close modal first, then navigate
                  setIsOpen(false);
                  setSelectedAppointment(null);
                  setShowNotifications(false);
                  
                  // Navigate after a short delay to ensure modal is closed
                  setTimeout(() => {
                    window.location.href = `/patients/${userId}/new-appointment`;
                  }, 100);
                }}
                style={{
                  backgroundColor: '#24AE7C',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#1E9A66'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#24AE7C'}
              >
                Book New Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          onClick={() => setShowNotifications(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
};
