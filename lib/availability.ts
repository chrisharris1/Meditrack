import { Doctors, Doctor, UnavailableSlot } from "@/constants";
import { getUnavailableSlots, logBlockedAttempt } from "./unavailabilityStorage";

export interface AvailabilityCheck {
  isAvailable: boolean;
  message: string;
  suggestedTimes?: string[];
  alternativeDoctors?: Doctor[];
}

export const checkDoctorAvailability = async (
  doctorName: string, 
  selectedDateTime: Date,
  existingAppointments?: any[] // All existing appointments from database
): Promise<AvailabilityCheck> => {
  const doctor = Doctors.find(d => d.name === doctorName);
  
  if (!doctor) {
    return {
      isAvailable: false,
      message: "Doctor not found"
    };
  }

  //  CHECK FOR APPROVED APPOINTMENTS (DOUBLE BOOKING PREVENTION)
  if (existingAppointments) {
    const scheduledConflict = existingAppointments.find(appointment => {
      const appointmentTime = new Date(appointment.schedule);
      const selectedTime = new Date(selectedDateTime);
      
      return (
        appointment.primaryPhysician === doctorName &&
        appointment.status === 'scheduled' && // Only check APPROVED appointments
        appointmentTime.toDateString() === selectedTime.toDateString() && // Same date
        appointmentTime.getHours() === selectedTime.getHours() && // Same hour
        appointmentTime.getMinutes() === selectedTime.getMinutes() // Same minute
      );
    });
    
    if (scheduledConflict) {
      const conflictDate = new Date(scheduledConflict.schedule).toLocaleDateString();
      const conflictTime = new Date(scheduledConflict.schedule).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return {
        isAvailable: false,
        message: `⛔ Dr. ${doctorName} is already booked at ${conflictTime} on ${conflictDate}. This slot has been approved by the office manager.`,
        suggestedTimes: generateAvailableSlots(doctor, selectedDateTime, existingAppointments),
        alternativeDoctors: await findAlternativeDoctors(doctor.specializations[0], selectedDateTime, doctorName)
      };
    }
  }

  const selectedDate = new Date(selectedDateTime);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const selectedTime = selectedDate.toTimeString().slice(0, 5); // "HH:MM"

  // Check if it's a day off
  if (doctor.workingHours.daysOff.includes(dayName)) {
    const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      .filter(day => !doctor.workingHours.daysOff.includes(day));
    
    return {
      isAvailable: false,
      message: `Dr. ${doctor.name} is not available on ${dayName}s. Available on: ${availableDays.join(', ')}`,
      suggestedTimes: generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end)
    };
  }

  // Check if it's within working hours
  if (selectedTime < doctor.workingHours.start || selectedTime >= doctor.workingHours.end) {
    return {
      isAvailable: false,
      message: `Dr. ${doctor.name} works from ${doctor.workingHours.start} to ${doctor.workingHours.end}`,
      suggestedTimes: generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end)
    };
  }

  // 🆕 Check if doctor has set any unavailable slots for this date/time
  const unavailabilityCheck = await checkUnavailableSlots(doctor, selectedDateTime);
  if (!unavailabilityCheck.isAvailable) {
    return {
      ...unavailabilityCheck,
      suggestedTimes: generateAvailableSlots(doctor, selectedDateTime, existingAppointments || []),
      alternativeDoctors: await findAlternativeDoctors(doctor.specializations[0], selectedDateTime, doctor.name)
    };
  }

  // If we get here, the doctor is available
  return {
    isAvailable: true,
    message: `Dr. ${doctor.name} is available at this time`
  };
};

export const findAlternativeDoctors = async (
  requestedSpecialization: string, 
  selectedDateTime: Date, 
  excludeDoctorName?: string
): Promise<Doctor[]> => {
  const alternativeDoctors: Doctor[] = [];
  
  for (const doctor of Doctors) {
    // Exclude the originally requested doctor
    if (doctor.name === excludeDoctorName) continue;
    
    // Check if doctor has the required specialization
    if (!doctor.specializations.some(spec => 
      spec.toLowerCase().includes(requestedSpecialization.toLowerCase()) ||
      requestedSpecialization.toLowerCase().includes(spec.toLowerCase())
    )) continue;
    
    // Check if this alternative doctor is available - PREVENT INFINITE RECURSION
    const availability = await checkDoctorAvailability(doctor.name, selectedDateTime, []);
    if (availability.isAvailable) {
      alternativeDoctors.push(doctor);
    }
  }
  
  return alternativeDoctors;
};

const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  for (let time = start; time < end; time += 60) { // 60 minute slots
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
};

const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getWorkingHours = (doctorName: string) => {
  const doctor = Doctors.find(d => d.name === doctorName);
  return doctor?.workingHours;
};

export const checkUnavailableSlots = async (
  doctor: Doctor,
  selectedDateTime: Date
): Promise<AvailabilityCheck> => {
  // Get dynamic unavailability slots from storage instead of static data
  const unavailableSlots = await getUnavailableSlots(doctor.name);
  
  if (!unavailableSlots || unavailableSlots.length === 0) {
    return { isAvailable: true, message: "" };
  }
  
  const selectedDate = new Date(selectedDateTime);
  const selectedTime = selectedDate.toTimeString().slice(0, 5); // "HH:MM"
  
  // Check each unavailable slot
  for (const slot of unavailableSlots) {
    const slotDate = new Date(slot.date);
    
    // Check if dates match (comparing date strings to avoid timezone issues)
    if (slotDate.toDateString() === selectedDate.toDateString()) {
      // All day unavailable
      if (slot.isAllDay) {
        const message = `❌ Dr. ${doctor.name} is not available on ${slotDate.toLocaleDateString()}${slot.reason ? ` (${slot.reason})` : ''}`;
        
        // Log blocked attempt for admin visibility
        logBlockedAttempt(doctor.name, selectedDate, selectedTime, slot.reason || 'All day unavailable');
        
        return {
          isAvailable: false,
          message
        };
      }
      
      // Specific time range unavailable
      if (slot.startTime && slot.endTime) {
        if (selectedTime >= slot.startTime && selectedTime <= slot.endTime) {
          const message = `❌ Dr. ${doctor.name} is not available from ${slot.startTime} to ${slot.endTime}${slot.reason ? ` (${slot.reason})` : ''}`;
          
          // Log blocked attempt for admin visibility
          logBlockedAttempt(doctor.name, selectedDate, selectedTime, slot.reason || 'Time-specific unavailable');
          
          return {
            isAvailable: false,
            message
          };
        }
      }
    }
  }
  
  return { isAvailable: true, message: "" };
};

const generateAvailableSlots = (
  doctor: Doctor, 
  selectedDate: Date, 
  existingAppointments: any[]
): string[] => {
  const allSlots = generateTimeSlots(doctor.workingHours.start, doctor.workingHours.end);
  const dateString = selectedDate.toDateString();
  
  // Filter out booked slots (only scheduled appointments)
  const availableSlots = allSlots.filter(timeSlot => {
    const testDateTime = new Date(selectedDate);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    testDateTime.setHours(hours, minutes, 0, 0);
    
    // Check if this slot conflicts with any scheduled appointment
    const hasConflict = existingAppointments.some(appointment => {
      if (appointment.primaryPhysician !== doctor.name) return false;
      if (appointment.status !== 'scheduled') return false; // Only check approved appointments
      
      const appointmentTime = new Date(appointment.schedule);
      return appointmentTime.toDateString() === dateString &&
             appointmentTime.getHours() === hours &&
             appointmentTime.getMinutes() === minutes;
    });
    
    return !hasConflict;
  });
  
  return availableSlots.slice(0, 5); // Show max 5 suggestions
};
