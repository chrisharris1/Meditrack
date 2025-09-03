"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Appointment } from "@/types/appwrite.types";
import { getUnreadRescheduleNotifications } from "@/lib/actions/reschedule.actions";

interface NotificationBellIconProps {
    userId: string;
    patientId: string;
    onNotificationClick: (appointment: Appointment) => void;
    onToggleNotifications: (show: boolean) => void;
    showNotifications: boolean;
}

export const NotificationBellIcon = ({
    userId,
    patientId,
    onNotificationClick,
    onToggleNotifications,
    showNotifications
}: NotificationBellIconProps) => {
    const [unreadNotifications, setUnreadNotifications] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Get notifications from database
                const notifications = await getUnreadRescheduleNotifications(userId);

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

        // Use Page Visibility API to pause polling when tab is inactive
        let interval: NodeJS.Timeout;
        
        const startPolling = () => {
            // Increased interval to 30 seconds to reduce load
            interval = setInterval(() => {
                // Only poll when page is visible
                if (!document.hidden) {
                    fetchNotifications();
                }
            }, 30000);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Clear interval when tab becomes inactive
                if (interval) clearInterval(interval);
            } else {
                // Resume polling and fetch immediately when tab becomes active
                fetchNotifications();
                startPolling();
            }
        };

        startPolling();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userId]);

    const toggleNotifications = () => {
        onToggleNotifications(!showNotifications);
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
                                        onClick={() => onNotificationClick(appointment)}
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

            {/* Click outside to close */}
            {showNotifications && (
                <div
                    onClick={() => onToggleNotifications(false)}
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
