"use client";

import { useState } from "react";
import Image from "next/image";
import AppointmentFormWrapper from "@/components/AppointmentFormWrapper";
import { NotificationBellIcon } from "@/components/NotificationBellIcon";
import { NotificationDialogs } from "@/components/NotificationDialogs";
import { ChatIcon } from "@/components/chat/ChatIcon";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { Appointment } from "@/types/appwrite.types";
import { markRescheduleNotificationAsRead } from "@/lib/actions/reschedule.actions";

interface AppointmentPageClientProps {
    userId: string;
    patient: any;
    isUpdateMode: boolean;
}

export default function AppointmentPageClient({ userId, patient, isUpdateMode }: AppointmentPageClientProps) {
    const [chatOpen, setChatOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

    const handleNotificationClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsNotificationDialogOpen(true);
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

        // Close dialogs
        setIsNotificationDialogOpen(false);
        setSelectedAppointment(null);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: '#0D0F10'
        }}>
            {/* Left side - Form section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 3rem',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden',
                flex: '1',
                maxWidth: '60%'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'auto',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 4rem)',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }} className="no-scrollbar remove-scrollbar">
                    <div style={{
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#0D0F10',
                        zIndex: 100,
                        paddingTop: '1rem',
                        paddingBottom: '1rem'
                    }}>
                        <Image
                            src="/assets/icons/logo-full.jpg"
                            height={40}
                            width={180}
                            alt="meditrack"
                            style={{ height: '40px', width: 'auto' }}
                            quality={100}
                            priority
                        />
                        {/* Professional Header Controls - Aligned with Logo */}
                        <div style={{
                            position: 'absolute',
                            top: '0px',
                            right: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(55, 65, 81, 0.12)',
                            backdropFilter: 'blur(6px)',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            border: '1px solid rgba(55, 65, 81, 0.25)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            zIndex: 100,
                            height: '40px'
                        }}>
                            <NotificationBellIcon
                                userId={userId}
                                patientId={patient?.$id || ''}
                                onNotificationClick={handleNotificationClick}
                                onToggleNotifications={setShowNotifications}
                                showNotifications={showNotifications}
                            />
                            <div style={{
                                width: '1px',
                                height: '20px',
                                backgroundColor: 'rgba(171, 184, 196, 0.25)'
                            }} />
                            <ChatIcon
                                roomId={userId}
                                user={{ id: userId, name: patient?.name || "Patient" }}
                                onOpen={() => setChatOpen(true)}
                            />
                        </div>
                    </div>

                    <AppointmentFormWrapper
                        patientId={patient?.$id || ''}
                        userId={userId}
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '2rem',
                        fontSize: '14px',
                        color: '#76828D',
                        paddingTop: '1rem'
                    }}>
                        <p style={{ margin: 0 }}>
                            © 2025 Meditrack
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Image section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1',
                maxWidth: '40%',
                background: 'linear-gradient(135deg, #0B1426 0%, #1E293B 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Image
                    src="/assets/images/appointment-img.png"
                    width={600}
                    height={800}
                    alt="medical professionals"
                    style={{
                        width: 'auto',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'right center'
                    }}
                />
            </div>

            {/* Chat and Notification components outside all containers for full viewport access */}
            <ChatDialog
                roomId={userId}
                role="patient"
                user={{ id: userId, name: patient?.name || "Patient" }}
                open={chatOpen}
                onOpenChange={setChatOpen}
            />

            {/* Notification dialogs rendered at root level for full viewport access */}
            <NotificationDialogs
                selectedAppointment={selectedAppointment}
                isOpen={isNotificationDialogOpen}
                onClose={() => setIsNotificationDialogOpen(false)}
                onUserAction={handleUserAction}
                userId={userId}
            />
        </div>
    );
}
