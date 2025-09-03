"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Doctors, Doctor, UnavailableSlot } from "@/constants";
import { UnavailabilityDialog } from "./UnavailabilityDialog";
import { addUnavailableSlot, getBlockedAttempts, getUnavailableSlots, removeAllDoctorUnavailability, clearBlockedAttempts } from "@/lib/unavailabilityStorage";

interface DoctorAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorAvailabilityDialog = ({ isOpen, onClose }: DoctorAvailabilityDialogProps) => {
  const [doctorAvailability, setDoctorAvailability] = useState<Record<string, boolean>>({});
  const [unavailabilityDialogOpen, setUnavailabilityDialogOpen] = useState(false);
  const [selectedDoctorForUnavailability, setSelectedDoctorForUnavailability] = useState<Doctor | null>(null);
  const [showBlockedAttempts, setShowBlockedAttempts] = useState<Record<string, boolean>>({});

  // Load availability from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('doctorAvailability');
      if (saved) {
        setDoctorAvailability(JSON.parse(saved));
      } else {
        // Initialize all doctors as available by default
        const defaultAvailability: Record<string, boolean> = {};
        Doctors.forEach(doctor => {
          defaultAvailability[doctor.name] = true;
        });
        setDoctorAvailability(defaultAvailability);
        localStorage.setItem('doctorAvailability', JSON.stringify(defaultAvailability));
      }
    } catch (error) {
      console.error('Error loading doctor availability:', error);
    }
  }, []);

  // 🆕 Listen for auto-cleanup events to update button states
  useEffect(() => {
    const handleCleanupEvent = async (event: CustomEvent) => {
      const { updatedDoctors } = event.detail;
      console.log(`🔄 Admin dialog: Auto-cleanup detected for doctors: ${updatedDoctors.join(', ')}`);

      // Update button states for doctors that had expired unavailability cleaned up
      if (updatedDoctors.length > 0) {
        setDoctorAvailability(prevAvailability => {
          const newAvailability = { ...prevAvailability };
          let hasChanges = false;

          for (const doctorName of updatedDoctors) {
            // Check if doctor still has any unavailable slots
            getUnavailableSlots(doctorName).then(remainingSlots => {
              if (remainingSlots.length === 0 && !prevAvailability[doctorName]) {
                // No more unavailable slots and currently unavailable, set back to available
                console.log(`⚡ Auto-toggled ${doctorName} back to available`);
                setDoctorAvailability(currentAvailability => {
                  const updated = { ...currentAvailability, [doctorName]: true };
                  localStorage.setItem('doctorAvailability', JSON.stringify(updated));
                  return updated;
                });
              }
            });
          }

          return newAvailability; // Return unchanged initially, updates happen asynchronously
        });
      }
    };

    window.addEventListener('unavailabilityCleanup', handleCleanupEvent as any);
    return () => {
      window.removeEventListener('unavailabilityCleanup', handleCleanupEvent as any);
    };
  }, []); // Remove doctorAvailability from dependency array

  // Toggle doctor availability
  const toggleAvailability = async (doctorName: string) => {
    const isCurrentlyAvailable = doctorAvailability[doctorName];
    const willBeAvailable = !isCurrentlyAvailable;
    
    // If toggling TO available, clean up database records
    if (willBeAvailable) {
      try {
        const result = await removeAllDoctorUnavailability(doctorName);
        
        if (result.success) {
          console.log(`✅ Cleared ${result.deletedCount} unavailability records for Dr. ${doctorName}`);
          
          // Show success message if records were deleted
          if (result.deletedCount > 0) {
            alert(`✅ Dr. ${doctorName} is now available!\n🗑️ Removed ${result.deletedCount} unavailability record(s) from database.`);
          }
        } else {
          console.error(`❌ Failed to clear unavailability for Dr. ${doctorName}:`, result.error);
          alert(`❌ Error making Dr. ${doctorName} available. Please try again.`);
          return; // Don't update button state if database cleanup failed
        }
      } catch (error) {
        console.error('Error clearing unavailability:', error);
        alert(`❌ Error making Dr. ${doctorName} available. Please try again.`);
        return; // Don't update button state if database cleanup failed
      }
    }
    
    // Update button state
    const newAvailability = {
      ...doctorAvailability,
      [doctorName]: willBeAvailable
    };
    setDoctorAvailability(newAvailability);
    localStorage.setItem('doctorAvailability', JSON.stringify(newAvailability));
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('doctorAvailabilityUpdated', {
      detail: { doctorName, isAvailable: newAvailability[doctorName] }
    }));
    
    // Dispatch special event for database cleanup (to refresh patient pages)
    if (willBeAvailable) {
      window.dispatchEvent(new CustomEvent('doctorUnavailabilityCleared', {
        detail: { doctorName }
      }));
    }
  };

  const handleUnavailabilityClick = (doctor: Doctor) => {
    setSelectedDoctorForUnavailability(doctor);
    setUnavailabilityDialogOpen(true);
  };

  const handleUnavailabilitySave = async (doctor: Doctor, unavailableSlot: UnavailableSlot) => {
    try {
      // Add unavailability to dynamic storage
      await addUnavailableSlot(doctor.name, unavailableSlot, "admin");
    
      // 🔧 FIX: Update button state to show "Not Available"
      const newAvailability = {
        ...doctorAvailability,
        [doctor.name]: false
      };
      setDoctorAvailability(newAvailability);
      
      // Save button state to localStorage
      localStorage.setItem('doctorAvailability', JSON.stringify(newAvailability));
      
      // Show success message with specific details
      const dateStr = unavailableSlot.date.toLocaleDateString();
      const timeStr = unavailableSlot.isAllDay 
        ? "All Day" 
        : `${unavailableSlot.startTime} - ${unavailableSlot.endTime}`;
      const reasonStr = unavailableSlot.reason ? ` (${unavailableSlot.reason})` : '';
      
      alert(`✅ Dr. ${doctor.name} marked unavailable:\n📅 ${dateStr}\n🕐 ${timeStr}${reasonStr}\n\n⚡ Data saved to Appwrite database - available across all sessions!`);
      
      console.log(`Dr. ${doctor.name} unavailability added:`, unavailableSlot);
    } catch (error) {
      console.error('Error saving unavailability:', error);
      alert(`❌ Error saving unavailability for Dr. ${doctor.name}. Please try again.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 50%, #000000 100%)',
          border: '1px solid rgba(55, 65, 81, 0.3)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#ffffff', 
              margin: '0 0 8px 0' 
            }}>
              👨‍⚕️ Doctor Availability Management
            </h2>
            <p style={{ 
              color: '#9CA3AF', 
              fontSize: '14px', 
              margin: 0 
            }}>
              Manage which doctors are available for new appointments
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#EF4444',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Doctor List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {Doctors.map((doctor, index) => {
            const isAvailable = doctorAvailability[doctor.name] ?? true;
            
            return (
              <div 
                key={doctor.name}
                style={{
                  background: 'rgba(55, 65, 81, 0.2)',
                  border: '1px solid rgba(75, 85, 99, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Doctor Image */}
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  width={60}
                  height={60}
                  style={{
                    borderRadius: '12px',
                    objectFit: 'cover',
                    opacity: isAvailable ? 1 : 0.5,
                    transition: 'opacity 0.3s ease'
                  }}
                />

                {/* Doctor Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: isAvailable ? '#ffffff' : '#9CA3AF',
                    margin: '0 0 4px 0',
                    transition: 'color 0.3s ease'
                  }}>
                    Dr. {doctor.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#9CA3AF',
                    margin: '0 0 8px 0'
                  }}>
                    {doctor.title}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {doctor.specializations.map((spec, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#60A5FA',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability Toggle - Left-Right Button Layout */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  minWidth: '200px'
                }}>
                  {/* Available Button (Left) */}
                  <button
                    onClick={() => {
                      if (!isAvailable) {
                        toggleAvailability(doctor.name);
                      }
                    }}
                    style={{
                      background: isAvailable 
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                        : 'rgba(16, 185, 129, 0.2)',
                      color: isAvailable ? 'white' : '#10B981',
                      border: isAvailable 
                        ? 'none' 
                        : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: isAvailable ? 'default' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      flex: 1,
                      transition: 'all 0.3s ease',
                      opacity: isAvailable ? 1 : 0.7,
                      boxShadow: isAvailable 
                        ? '0 4px 6px -1px rgba(16, 185, 129, 0.3)' 
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isAvailable) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px -1px rgba(16, 185, 129, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isAvailable) {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isAvailable ? '✅ Available' : 'Available'}
                  </button>

                  {/* Not Available Button (Right) */}
                  <button
                    onClick={() => {
                      if (isAvailable) {
                        handleUnavailabilityClick(doctor);
                      }
                    }}
                    style={{
                      background: !isAvailable 
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                        : 'rgba(239, 68, 68, 0.2)',
                      color: !isAvailable ? 'white' : '#EF4444',
                      border: !isAvailable 
                        ? 'none' 
                        : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: !isAvailable ? 'default' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      flex: 1,
                      transition: 'all 0.3s ease',
                      opacity: !isAvailable ? 1 : 0.7,
                      boxShadow: !isAvailable 
                        ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' 
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (isAvailable) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px -1px rgba(239, 68, 68, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isAvailable) {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {!isAvailable ? '❌ Not Available' : 'Not Available'}
                  </button>
                </div>

                     {/* Admin Visibility: Blocked Attempts */}
                       <div style={{ marginTop: '12px' }}>
                           <button
                     type="button"
                     onClick={() => setShowBlockedAttempts(prev => ({
                       ...prev,
                       [doctor.name]: !prev[doctor.name]
                     }))}
                     style={{
                       background: 'rgba(239, 68, 68, 0.1)',
                       border: '1px solid rgba(239, 68, 68, 0.3)',
                       color: '#ef4444',
                       padding: '6px 12px',
                       borderRadius: '6px',
                       fontSize: '12px',
                       fontWeight: '500',
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       width: '100%'
                     }}
                   >
                     {showBlockedAttempts[doctor.name] ? '🔽 Hide Recent Activity' : '📊 Show Recent Activity'}
                   </button>
                   
                   {showBlockedAttempts[doctor.name] && (
                     <div style={{
                       marginTop: '8px',
                       padding: '12px',
                       background: 'rgba(17, 24, 39, 0.8)',
                       border: '1px solid rgba(75, 85, 99, 0.3)',
                       borderRadius: '8px'
                     }}>
                       {(() => {
                       const blockedAttempts = getBlockedAttempts(doctor.name);
                       
                       if (blockedAttempts.length === 0) {
                         return (
                         <p style={{
                         color: '#9ca3af',
                       fontSize: '12px',
                       margin: 0,
                       fontStyle: 'italic'
                       }}>
                         No recent booking attempts blocked
                       </p>
                       );
                       }
                       
                       return (
                         <>
                         <div style={{
                         display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                       marginBottom: '8px'
                       }}>
                         <div style={{
                         color: '#ef4444',
                           fontSize: '12px',
                           fontWeight: '600'
                       }}>
                       🚫 Recent Blocked Bookings ({blockedAttempts.length} total)
                       </div>
                       <button
                       onClick={() => {
                         const cleared = clearBlockedAttempts(doctor.name);
                           if (cleared > 0) {
                           alert(`✅ Cleared ${cleared} blocked booking record${cleared > 1 ? 's' : ''} for Dr. ${doctor.name}`);
                           // Force re-render by updating state
                           setShowBlockedAttempts(prev => ({
                           ...prev,
                             [doctor.name]: false
                             }));
                               setTimeout(() => {
                                   setShowBlockedAttempts(prev => ({
                                       ...prev,
                                         [doctor.name]: true
                                        }));
                                      }, 100);
                                    }
                                  }}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  🗑️ Clear All
                                </button>
                              </div>
                              
                              {/* Scrollable container for all blocked attempts */}
                              <div style={{
                                maxHeight: '200px', // Fixed height for scrolling
                                overflowY: 'auto',
                                paddingRight: '8px'
                              }}>
                                {blockedAttempts.map((attempt, idx) => (
                                  <div key={idx} style={{
                                    fontSize: '11px',
                                    color: '#d1d5db',
                                    marginBottom: '6px',
                                    paddingLeft: '8px',
                                    paddingRight: '4px',
                                    paddingTop: '4px',
                                    paddingBottom: '4px',
                                    borderLeft: '2px solid rgba(239, 68, 68, 0.3)',
                                    backgroundColor: 'rgba(17, 24, 39, 0.4)',
                                    borderRadius: '4px'
                                  }}>
                                    📅 {attempt.attemptedDate.toLocaleDateString()} at {attempt.attemptedTime}
                                    <br />
                                    <span style={{ color: '#9ca3af' }}>
                                      Reason: {attempt.reason} • {new Date(attempt.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                     </div>
                   )}
                 </div>
              </div>
            );
          })}
        </div>

        {/* Manual Cleanup Button for Testing */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          borderRadius: '8px'
        }}>
          <button
            onClick={async () => {
              console.log('🔧 Manual cleanup triggered');
              const { cleaned, updatedDoctors } = await import('@/lib/unavailabilityStorage').then(m => m.cleanupExpiredUnavailability());
              if (cleaned.length > 0) {
                alert(`✅ Manual cleanup completed!\n🗑️ Removed ${cleaned.length} expired slots\n👨‍⚕️ Doctors updated: ${updatedDoctors.join(', ')}`);
                console.log(`⚡ Manual cleanup: ${cleaned.length} expired slots removed for doctors: ${updatedDoctors.join(', ')}`);
              } else {
                alert('ℹ️ No expired unavailability slots found to clean up.');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px -1px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔧 Test Auto-Cleanup (Manual Trigger)
          </button>
          <p style={{
            fontSize: '11px',
            color: '#9CA3AF',
            margin: '8px 0 0 0',
            textAlign: 'center'
          }}>
            Use this to test the auto-cleanup functionality immediately
          </p>
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: '12px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#9CA3AF',
            margin: 0,
            textAlign: 'center'
          }}>
            💡 <strong style={{color: '#60A5FA'}}>Tip:</strong> Changes will be reflected immediately in the appointment booking form.
            Unavailable doctors will appear dimmed with "Doctor not available" message.
          </p>
        </div>
      </div>

      {/* Unavailability Dialog */}
      {selectedDoctorForUnavailability && (
        <UnavailabilityDialog
          doctor={selectedDoctorForUnavailability}
          isOpen={unavailabilityDialogOpen}
          onClose={() => {
            setUnavailabilityDialogOpen(false);
            setSelectedDoctorForUnavailability(null);
          }}
          onSave={handleUnavailabilitySave}
        />
      )}
    </div>
  );
};
