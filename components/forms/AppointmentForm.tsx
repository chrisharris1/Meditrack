"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useMemo, useEffect, useCallback } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Doctors, MedicalSpecialization, AppointmentStatus } from "@/constants";
import { checkDoctorAvailability } from "@/lib/availability";
import {
  createAppointment,
  updateAppointment,
} from "@/lib/actions/appointment.actions";
import {
  createRescheduleNotification,
  deleteRescheduleNotification
} from "@/lib/actions/reschedule.actions";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment } from "@/types/appwrite.types";
import { SmartRecommendations } from "@/components/SmartRecommendations";


import "react-datepicker/dist/react-datepicker.css";
import { ChevronDownIcon } from "lucide-react";

// Add CSS for pulsing animation
const pulseKeyframes = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 15px rgba(255, 26, 26, 0.8), 0 0 8px rgba(255, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    50% {
      box-shadow: 0 0 25px rgba(255, 26, 26, 1), 0 0 15px rgba(255, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 15px rgba(255, 26, 26, 0.8), 0 0 8px rgba(255, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  }
`;

// Inject the CSS into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = pulseKeyframes;
  document.head.appendChild(styleSheet);
}

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";

export const AppointmentForm = ({
  userId,
  patientId,
  type = "create",
  appointment,
  setOpen,
  isAdminReschedule = false,
}: {
  userId: string;
  patientId: string;
  type: "create" | "schedule" | "cancel" | "reschedule";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  isAdminReschedule?: boolean;
}) => {
  const router = useRouter();
 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState<MedicalSpecialization | "All">("All");
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    isChecking: boolean;
    message: string;
    isAvailable: boolean;
    suggestedTimes?: string[];
    alternativeDoctors?: any[];
  }>({ isChecking: false, message: "", isAvailable: true });
  // 🆕 REMOVED: doctorAvailability state - no longer blocking doctor selection
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Use the explicit isAdminReschedule prop to determine admin context
  const isAdminContext = isAdminReschedule;

  const AppointmentFormValidation = getAppointmentSchema(type);

  // Get all unique specializations
  const specializations: (MedicalSpecialization | "All")[] = [
    "All",
    "General Medicine",
    "Cancer/Oncology",
    "Heart/Cardiology",
    "Skin/Dermatology",
    "Bone/Orthopedics",
    "Mental Health",
    "Diabetes",
    "Cold & Fever",
  ];

  // Filter doctors based on selected specialization
  const filteredDoctors = useMemo(() => {
    if (selectedSpecialization === "All") {
      return Doctors;
    }
    return Doctors.filter(doctor => doctor.specializations.includes(selectedSpecialization));
  }, [selectedSpecialization]);

  // NEW FEATURES - Smart Recommendations & Interactive Calendar



  const getSpecializationColor = (spec: MedicalSpecialization | "All") => {
    const colors: Record<MedicalSpecialization | "All", string> = {
      "All": "#24AE7C",
      "General Medicine": "#3B82F6",
      "Cancer/Oncology": "#EF4444",
      "Heart/Cardiology": "#DC2626",
      "Skin/Dermatology": "#F59E0B",
      "Bone/Orthopedics": "#8B5CF6",
      "Mental Health": "#06B6D4",
      "Diabetes": "#10B981",
      "Cold & Fever": "#6366F1",
    };
    return colors[spec] || "#6B7280";
  };

  // Function to check availability (memoized to prevent infinite loops)
  const checkAvailability = useCallback(async (doctorName: string, selectedDate: Date) => {
    if (!doctorName || !selectedDate) {
      setAvailabilityStatus({ isChecking: false, message: "", isAvailable: true });
      return;
    }

    setAvailabilityStatus({ isChecking: true, message: "Checking availability...", isAvailable: true });

    try {
      // In a real app, you'd fetch existing appointments from the database
      // For now, we'll pass an empty array or mock data
      const existingAppointments: any[] = [];
      
      const availabilityResult = await checkDoctorAvailability(doctorName, selectedDate, existingAppointments);
      
      setAvailabilityStatus({
        isChecking: false,
        message: availabilityResult.message,
        isAvailable: availabilityResult.isAvailable,
        suggestedTimes: availabilityResult.suggestedTimes,
        alternativeDoctors: availabilityResult.alternativeDoctors
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus({
        isChecking: false,
        message: "Error checking availability. Please try again.",
        isAvailable: false
      });
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment?.primaryPhysician || "",
      schedule: appointment?.schedule || new Date(),
      reason: appointment?.reason || "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
      adminNotes: appointment?.adminNotes || "",
    },
  });

  // Load existing appointment data into form fields
  useEffect(() => {
    if (appointment && (type === "reschedule" || type === "schedule" || type === "cancel")) {
      form.reset({
        primaryPhysician: appointment.primaryPhysician || "",
        schedule: appointment.schedule ? new Date(appointment.schedule) : new Date(),
        reason: appointment.reason || "",
        note: appointment.note || "",
        cancellationReason: appointment.cancellationReason || "",
        adminNotes: appointment.adminNotes || "",
      });
    }
  }, [appointment, type, form]);

  // 🆕 REMOVED: Doctor availability loading - no longer blocking doctor selection

  // Watch for changes in doctor selection and schedule to check availability
  const primaryPhysician = form.watch("primaryPhysician");
  const schedule = form.watch("schedule");
  
  useEffect(() => {
    // Only check availability for create and patient-initiated reschedule types
    // Don't check availability for admin reschedules (when setOpen is provided)
    if (type === "create" || (type === "reschedule" && !isAdminContext)) {
      if (primaryPhysician && schedule) {
        // 🆕 REMOVED: Doctor selection blocking - now all doctors are always selectable
        // Users can select any doctor and will see specific unavailability messages for dates/times
        
        // Check time-specific availability (working hours, days off, unavailable slots)
        const timeoutId = setTimeout(() => {
          checkAvailability(primaryPhysician, new Date(schedule));
        }, 500);
        
        return () => clearTimeout(timeoutId);
      } else {
        // Clear availability status if no doctor or date selected
        setAvailabilityStatus({ isChecking: false, message: "", isAvailable: true });
      }
    }
  }, [primaryPhysician, schedule, type, checkAvailability, isAdminContext]);

  // 🆕 Listen for auto-cleanup events to refresh availability in real-time
  useEffect(() => {
    const handleCleanupEvent = async (event: CustomEvent) => {
      const { updatedDoctors } = event.detail;
      console.log(`🔄 Auto-cleanup detected for doctors: ${updatedDoctors.join(', ')}`);
      
      // Refresh availability if current selected doctor was updated
      if (primaryPhysician && schedule && updatedDoctors.includes(primaryPhysician)) {
        console.log(`♻️ Refreshing availability for ${primaryPhysician} after auto-cleanup`);
        await checkAvailability(primaryPhysician, new Date(schedule));
      }
    };

    window.addEventListener('unavailabilityCleanup', handleCleanupEvent as any);
    return () => {
      window.removeEventListener('unavailabilityCleanup', handleCleanupEvent as any);
    };
  }, [primaryPhysician, schedule, checkAvailability]);

  // 🆕 Listen for database cleanup events (when admin makes doctor available)
  useEffect(() => {
    const handleUnavailabilityCleared = async (event: CustomEvent) => {
      const { doctorName } = event.detail;
      console.log(`🔄 Database cleared for Dr. ${doctorName} - refreshing availability`);
      
      // Refresh availability if this is the currently selected doctor
      if (primaryPhysician === doctorName && schedule) {
        console.log(`♻️ Refreshing availability for ${doctorName} after database cleanup`);
        await checkAvailability(primaryPhysician, new Date(schedule));
      }
    };

    window.addEventListener('doctorUnavailabilityCleared', handleUnavailabilityCleared as any);
    return () => {
      window.removeEventListener('doctorUnavailabilityCleared', handleUnavailabilityCleared as any);
    };
  }, [primaryPhysician, schedule, checkAvailability]);

const onSubmit: SubmitHandler<z.infer<typeof AppointmentFormValidation>> = async (
    values
  ) => {
    // Prevent double submission spam
    if (isLoading) {
      console.log("⚠️ Form already submitting, ignoring duplicate");
      return;
    }
    
    console.log("📝 Form submission started");
    setIsLoading(true);

    let status;
    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      case "reschedule":
        // Always set reschedule to 'pending' status in database
        // We'll handle 'rescheduled' tracking in localStorage only
        status = "pending";
        break;
      default:
        status = "pending";
    }

    try {
      if (type === "create" && patientId) {
        const appointment = {
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status: status as AppointmentStatus,
          note: values.note,
        };

        const newAppointment = await createAppointment(appointment);

        if (newAppointment) {
          form.reset();
          // Use window.location for faster navigation
          window.location.href = `/patients/${userId}/new-appointment/success?appointmentId=${newAppointment.$id}&isUpdate=false`;
        }
      } else {
        // Create clean appointment object with only updatable fields for database
        // Remove relationship fields (userId, patient) that cause Appwrite errors during updates
        const appointmentToUpdate = {
          userId,
          appointmentId: appointment?.$id!,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            reason: values.reason || appointment!.reason,
            note: values.note || appointment!.note,
            status: status as AppointmentStatus,
            cancellationReason: values.cancellationReason,
            adminNotes: values.adminNotes,
          },
          type,
        };
        
        // Handle reschedule notifications in database
        if (type === 'reschedule') {
          try {
            if (isAdminReschedule && values.adminNotes) {
              // Admin reschedule: Create database notification
              await createRescheduleNotification({
                appointmentId: appointment?.$id!,
                userId: userId,
                adminNotes: values.adminNotes,
                doctorName: values.primaryPhysician,
                scheduleTime: new Date(values.schedule),
                originalReason: appointment?.reason,
                originalNote: appointment?.note,
                createdBy: "admin"
              });
              
              console.log('✅ Admin reschedule - saved to database');
            } else if (!isAdminReschedule) {
              // User reschedule: Remove from reschedule notifications database
              // (user responded to admin reschedule, so status should show as 'pending' not 'rescheduled')
              await deleteRescheduleNotification(appointment?.$id!, userId);
              
              console.log('✅ User reschedule - removed from database, will show as pending');
            }
            
            // Dispatch custom event to update counters and status badges
            window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
          } catch (error) {
            console.error('❌ Error handling reschedule notification:', error);
          }
        }
        
        // Remove from reschedule notifications when cancelled or scheduled
        if (type === 'cancel' || type === 'schedule') {
          try {
            await deleteRescheduleNotification(appointment?.$id!, userId);
            
            // Dispatch custom event to update counters and status badges
            window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
            
            console.log(`✅ ${type === 'cancel' ? 'Cancelled' : 'Scheduled'} appointment - removed from database`);
          } catch (error) {
            console.error('❌ Error removing reschedule notification:', error);
          }
        }
        
        console.log('Form submitting appointment update:', appointmentToUpdate);
        console.log('Type is reschedule:', type === 'reschedule');
        console.log('Is admin reschedule:', isAdminReschedule);
        console.log('Admin notes:', values.adminNotes);
        console.log('Status being set to:', status);

        console.log('About to call updateAppointment with:', appointmentToUpdate);
        const updatedAppointment = await updateAppointment(appointmentToUpdate);
        console.log('updateAppointment result:', updatedAppointment);

        if (updatedAppointment) {
          console.log('Update successful, resetting form');
          form.reset();
          
          // For admin reschedule (modal), close the dialog immediately
          if (isAdminReschedule && setOpen) {
            console.log('Admin reschedule detected, closing dialog');
            setOpen(false);
            // Dispatch event instead of page reload (much faster)
            window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
          }
          
          // Redirect to success page for patient reschedules (not admin reschedules)
          if (type === "reschedule" && !isAdminReschedule) {
            console.log('Patient reschedule detected, redirecting to success page');
            // Use window.location for faster navigation
            window.location.href = `/patients/${userId}/new-appointment/success?appointmentId=${updatedAppointment.$id}&isUpdate=true`;
          }
        } else {
          console.log('updateAppointment returned falsy result');
          // Still close dialog even if update didn't return expected result (only for admin reschedules)
          if (isAdminReschedule && setOpen) {
            console.log('Force closing dialog due to no result');
            setTimeout(() => {
              setOpen(false);
            }, 500);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  let buttonLabel;
  switch (type) {
    case "cancel":
      buttonLabel = "Cancel Appointment";
      break;
    case "schedule":
      buttonLabel = "Schedule Appointment";
      break;
    case "reschedule":
      buttonLabel = "Reschedule Appointment";
      break;
    default:
      buttonLabel = "Submit and continue";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        {type === "create" && (
          <section style={{ marginBottom: '3rem' }}>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'white', 
              margin: '0 0 8px 0' 
            }}>Hey there 👋</h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#ABB8C4', 
              margin: '0 0 1.5rem 0' 
            }}>
              Request a new appointment in 10 seconds
            </p>
          </section>
        )}

        {type !== "cancel" && (
          <>
            {/* Doctor Filter Section - Hide for admin reschedules */}
            {!isAdminContext && (
              <div className="mb-6">
                <div className="space-y-3">
                  <label className="text-14-medium" style={{ color: '#ABB8C4' }}>Specialization</label>
                  <div className="relative">
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value as MedicalSpecialization | "All")}
                      className="shad-select-trigger cursor-pointer"
                      style={{
                        width: '100%',
                        height: '48px',
                        backgroundColor: '#1A1D21',
                        border: '1px solid #363A3D',
                        borderRadius: '16px',
                        padding: '0 50px 0 20px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '500',
                        appearance: 'none',
                        outline: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2324AE7C' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 16px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '20px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#24AE7C';
                        e.target.style.boxShadow = '0 0 0 1px #24AE7C';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#363A3D';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {specializations.map((spec) => (
                        <option
                          key={spec}
                          value={spec}
                          style={{
                            backgroundColor: '#1A1D21',
                            color: 'white',
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
                        >
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  
                 </div>
               </div>
             )}

             



             <div style={{ marginTop: '1.5rem' }}>
              {isAdminContext ? (
                // Show doctor info as read-only display for admin
                <div style={{ marginBottom: '24px' }}>
                  <label 
                    className="text-14-medium" 
                    style={{ 
                      color: '#ABB8C4', 
                      marginBottom: '8px', 
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Doctor (Read-only)
                  </label>
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#131619',
                    border: '1px solid #2A2D31',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '12px',
                      backgroundColor: '#374151',
                      color: '#9CA3AF',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Read Only
                    </div>
                    {(() => {
                      const doctor = Doctors.find(d => d.name === form.getValues('primaryPhysician'));
                      return doctor ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <img
                            src={doctor.image}
                            width={48}
                            height={48}
                            alt="doctor"
                            style={{
                              borderRadius: '50%',
                              border: '3px solid #2A2D31',
                              objectFit: 'cover',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              color: 'white', 
                              fontSize: '16px', 
                              fontWeight: '600',
                              marginBottom: '4px'
                            }}>
                              Dr. {doctor.name}
                            </div>
                            <div style={{ 
                              color: '#9CA3AF', 
                              fontSize: '14px',
                              lineHeight: '1.4'
                            }}>
                              {doctor.title}
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '6px',
                              marginTop: '8px',
                              flexWrap: 'wrap'
                            }}>
                              {doctor.specializations.slice(0, 2).map((spec) => (
                                <span
                                  key={spec}
                                  style={{
                                    backgroundColor: `${getSpecializationColor(spec)}20`,
                                    color: getSpecializationColor(spec),
                                    border: `1px solid ${getSpecializationColor(spec)}40`,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#76828D' }}>No doctor selected</span>
                      )
                    })()} 
                  </div>
                </div>
              ) : (
                <CustomFormField
                  fieldType={FormFieldType.SELECT}
                  control={form.control}
                  name="primaryPhysician"
                  label="Doctor"
                  placeholder="Select a doctor"
                >
                {filteredDoctors.map((doctor, i) => {
                  // 🆕 REMOVED: Doctor availability checking for selection
                  // All doctors are now always selectable - unavailability is checked for specific dates/times only
                  
                  return (
                    <SelectItem 
                      key={doctor.name + i} 
                      value={doctor.name}
                    >
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 8px',
                          width: '100%',
                          minHeight: '80px',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        {/* 🆕 REMOVED: Unavailable overlay - all doctors are selectable */}
                        
                        <Image
                          src={doctor.image}
                          width={40}
                          height={40}
                          alt="doctor"
                          style={{
                            borderRadius: '50%',
                            border: '2px solid #363A3D',
                            flexShrink: 0,
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'flex-start',
                          gap: '4px',
                          flex: 1,
                          minWidth: 0 // Prevents text overflow
                        }}>
                          <span style={{ 
                            color: 'white', 
                            fontSize: '15px', 
                            lineHeight: '1.3', 
                            fontWeight: '600',
                            marginBottom: '2px'
                          }}>
                            {doctor.name}
                          </span>
                          
                          <span style={{ 
                            color: '#76828D', 
                            fontSize: '13px', 
                            lineHeight: '1.3',
                            marginBottom: '3px'
                          }}>
                            {doctor.title}
                          </span>
                          
                          {/* Show working hours and other details for all doctors */}
                          <span style={{ 
                            color: '#9CA3AF', 
                            fontSize: '12px', 
                            lineHeight: '1.4',
                            marginBottom: '6px',
                            fontFamily: 'monospace', // Better for time display
                            wordWrap: 'break-word',
                            maxWidth: '100%'
                          }}>
                            🕐 {doctor.workingHours.start} - {doctor.workingHours.end}
                            {doctor.workingHours.daysOff.length > 0 && (
                              <span style={{ 
                                display: 'block', 
                                marginTop: '3px',
                                fontSize: '11px',
                                wordWrap: 'break-word'
                              }}>
                                🚫 Days off: {doctor.workingHours.daysOff.join(', ')}
                              </span>
                            )}
                          </span>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: '6px', 
                            flexWrap: 'wrap',
                            marginTop: '2px'
                          }}>
                            {doctor.specializations.map((spec) => (
                              <span
                                key={spec}
                                style={{
                                  backgroundColor: `${getSpecializationColor(spec)}15`,
                                  color: getSpecializationColor(spec),
                                  border: `1px solid ${getSpecializationColor(spec)}40`,
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
                </CustomFormField>
              )}
            </div>

            



                         {/* Hide patient fields for admin context */}
             {!isAdminContext && (
               <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: '1fr 1fr', 
                 gap: '1.25rem', 
                 width: '100%',
                 marginTop: '1rem',
                 marginBottom: '1.5rem'
               }}>
                 <CustomFormField
                   fieldType={FormFieldType.TEXTAREA}
                   control={form.control}
                   name="reason"
                   label={('Appointment Reason')}
                   placeholder={('Annual montly check-up')}
                   disabled={type === "schedule"}
                 />

                 <CustomFormField
                   fieldType={FormFieldType.TEXTAREA}
                   control={form.control}
                   name="note"
                   label={('Comment/Notes')}
                   placeholder={('Prefer afternoon appointments')}
                   disabled={type === "schedule"}
                 />
               </div>
             )}

             {/* Smart Recommendations - AFTER text boxes */}
             {!isAdminContext && (
               <div style={{ marginBottom: '1.5rem' }}>
                 <div style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   marginBottom: '1rem'
                 }}>
                   <h3 style={{ 
                     color: '#FFFFFF', 
                     fontSize: '18px', 
                     fontWeight: '600',
                     margin: 0
                   }}>
                     🎯 {('Appointment Smart Recommendations')}
                   </h3>
                   <button
                     type="button"
                     onClick={() => setShowRecommendations(!showRecommendations)}
                     style={{
                       background: 'rgba(36, 174, 124, 0.1)',
                       border: '1px solid rgba(36, 174, 124, 0.3)',
                       color: '#24AE7C',
                       padding: '8px 16px',
                       borderRadius: '8px',
                       fontSize: '14px',
                       fontWeight: '500',
                       cursor: 'pointer',
                       transition: 'all 0.2s ease'
                     }}
                   >
                     {showRecommendations ? ('Hide Recommendations') : ('Show Recommendations')}
                   </button>
                 </div>
                 
                 {showRecommendations && (
                   <SmartRecommendations
                   reason={form.watch("reason") || ""}
                   selectedSpecialization={selectedSpecialization}
                   onDoctorSelect={(doctorName) => {
                     form.setValue("primaryPhysician", doctorName);
                   setShowRecommendations(false);
                   }}
                   />
                 )}
               </div>
             )}

            {isAdminContext ? (
              // Show current date/time as read-only for admin
              <div style={{ marginBottom: '32px' }}>
                <label 
                  className="text-14-medium" 
                  style={{ 
                    color: '#ABB8C4', 
                    marginBottom: '8px', 
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Current Appointment Date & Time (Read-only)
                </label>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#131619',
                  border: '1px solid #2A2D31',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    backgroundColor: '#374151',
                    color: '#9CA3AF',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Read Only
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#24AE7C20',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '20px' }}>📅</span>
                    </div>
                    <div>
                      <div style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {new Date(form.getValues('schedule')).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{
                        color: '#9CA3AF',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>🕐</span>
                        {new Date(form.getValues('schedule')).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Expected appointment date"
              showTimeSelect
              dateFormat="MM/dd/yyyy  -  h:mm aa"
              minDate={new Date()}
            />
            )}

            {/* Availability Status Display - Only show for patient-facing forms */}
            {availabilityStatus.message && (type === "create" || (type === "reschedule" && !isAdminContext)) && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: availabilityStatus.isAvailable ? '#065f46' : '#7f1d1d',
                border: `1px solid ${availabilityStatus.isAvailable ? '#10b981' : '#ef4444'}`,
                marginTop: '16px'
              }}>
                <p style={{
                  color: availabilityStatus.isAvailable ? '#10b981' : '#ef4444',
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  {availabilityStatus.isAvailable ? '✅ Available' : '❌ Not Available'}
                </p>
                <p style={{
                  color: 'white',
                  fontSize: '13px',
                  margin: 0
                }}>
                  {availabilityStatus.message}
                </p>
                
                {availabilityStatus.suggestedTimes && availabilityStatus.suggestedTimes.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      margin: '0 0 6px 0'
                    }}>
                      Suggested available times:
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {availabilityStatus.suggestedTimes.map((time) => (
                        <span
                          key={time}
                          style={{
                            backgroundColor: '#374151',
                            color: '#10b981',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            border: '1px solid #4b5563'
                          }}
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {type === "cancel" && (
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="cancellationReason"
            label="Reason for cancellation"
            placeholder="Urgent meeting came up"
          />
        )}

        {/* Admin Notes field - Only show for admin reschedules */}
        {type === "reschedule" && isAdminContext && (
          <div style={{ marginTop: '0' }}>
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="adminNotes"
              label="Admin Notes & Time Suggestions"
              placeholder="Dr. Smith is fully booked that day. Available alternative slots: • January 15th at 10:00 AM • January 15th at 4:00 PM • January 16th at 2:00 PM Please select a new time that works for you."
            />
          </div>
        )}

        <SubmitButton
          isLoading={isLoading}
          className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
          disabled={!availabilityStatus.isAvailable && (type === "create" || (type === "reschedule" && !isAdminContext))}
          disabledMessage={!availabilityStatus.isAvailable ? "Doctor not available for selected date/time" : undefined}
        >
          {buttonLabel}
        </SubmitButton>
      </form>
    </Form>
  );
};


export default AppointmentForm
