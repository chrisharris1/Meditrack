"use client";

import { Appointment } from "@/types/appwrite.types";
import { markRescheduleNotificationAsRead } from "@/lib/actions/reschedule.actions";

interface NotificationDialogsProps {
    selectedAppointment: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
    onUserAction: (appointmentId: string) => void;
    userId: string;
}

export const NotificationDialogs = ({
    selectedAppointment,
    isOpen,
    onClose,
    onUserAction,
    userId
}: NotificationDialogsProps) => {
    if (!selectedAppointment || !isOpen) {
        return null;
    }

    // Handle marking notification as read in database
    const handleMarkAsRead = async (appointmentId: string) => {
        try {
            await markRescheduleNotificationAsRead(appointmentId, userId);
            console.log(`✅ Marked notification as read in database: ${appointmentId}`);
            
            // Call the parent onUserAction for UI updates
            onUserAction(appointmentId);
            
            // Dispatch event to refresh notification components
            window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            // Still call onUserAction for UI consistency
            onUserAction(appointmentId);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50000, // Higher z-index to ensure it's above everything
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
                        onClick={onClose}
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
                        flex: 1, // Allow this section to expand and show full content
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
                            wordWrap: 'break-word', // Ensure long text wraps properly
                            overflowWrap: 'break-word',
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
                        marginTop: 'auto', // Push buttons to bottom
                    }}
                >
                    <button
                        onClick={() => {
                            // Mark as read when dismissed
                            handleMarkAsRead(selectedAppointment.$id);
                            onClose();
                        }}
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
                        onClick={async () => {
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

                            // Mark notification as read in database
                            await handleMarkAsRead(selectedAppointment.$id);

                            // Close modal first, then navigate
                            onClose();

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
                        onClick={async () => {
                            // Mark notification as read in database
                            await handleMarkAsRead(selectedAppointment.$id);

                            // Close modal first, then navigate
                            onClose();

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
    );
};
