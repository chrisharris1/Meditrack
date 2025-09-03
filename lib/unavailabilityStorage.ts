import { UnavailableSlot } from "@/constants";
import { 
  createUnavailability, 
  getUnavailabilitySlots, 
  getAllUnavailabilityData as getAllUnavailabilityDataFromDB,
  cleanupExpiredUnavailability as cleanupExpiredUnavailabilityInDB,
  removeUnavailabilitySlot as removeUnavailabilitySlotFromDB,
  removeAllUnavailabilityForDoctor
} from "./actions/unavailability.actions";

// LocalStorage keys for blocked attempts (keeping this client-side for now)
const BLOCKED_ATTEMPTS_KEY = 'blockedBookingAttempts';

// Helper functions for localStorage operations (for blocked attempts only)
const saveToLocalStorage = (key: string, data: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any): any => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Get blocked attempts from localStorage (keeping client-side for performance)
const getBlockedAttemptsData = (): Array<{
  doctorName: string;
  attemptedDate: Date;
  attemptedTime: string;
  reason: string;
  timestamp: Date;
}> => {
  const data = loadFromLocalStorage(BLOCKED_ATTEMPTS_KEY, []);
  // Convert date strings back to Date objects
  return data.map((attempt: any) => ({
    ...attempt,
    attemptedDate: new Date(attempt.attemptedDate),
    timestamp: new Date(attempt.timestamp)
  }));
};

export const getUnavailableSlots = async (doctorName: string): Promise<UnavailableSlot[]> => {
  try {
    return await getUnavailabilitySlots(doctorName);
  } catch (error) {
    console.error("Error getting unavailable slots:", error);
    return [];
  }
};

export const addUnavailableSlot = async (doctorName: string, slot: UnavailableSlot, createdBy: string = "admin"): Promise<void> => {
  try {
    await createUnavailability({
      doctorName,
      slot,
      createdBy
    });
    console.log(`Added unavailability for Dr. ${doctorName}:`, slot);
  } catch (error) {
    console.error("Error adding unavailable slot:", error);
    throw error;
  }
};

export const removeUnavailableSlot = async (doctorName: string, slot: UnavailableSlot): Promise<void> => {
  try {
    await removeUnavailabilitySlotFromDB({ doctorName, slot });
    console.log(`Removed unavailability slot for Dr. ${doctorName}`);
  } catch (error) {
    console.error("Error removing unavailable slot:", error);
    throw error;
  }
};

export const getAllUnavailabilityData = async (): Promise<Record<string, UnavailableSlot[]>> => {
  try {
    return await getAllUnavailabilityDataFromDB();
  } catch (error) {
    console.error("Error getting all unavailability data:", error);
    return {};
  }
};

// Track blocked booking attempts
export const logBlockedAttempt = (
  doctorName: string, 
  attemptedDate: Date, 
  attemptedTime: string, 
  reason: string
): void => {
  const blockedAttempts = getBlockedAttemptsData();
  blockedAttempts.push({
    doctorName,
    attemptedDate,
    attemptedTime,
    reason,
    timestamp: new Date()
  });
  
  // Keep only last 100 attempts to prevent memory issues
  const trimmedAttempts = blockedAttempts.length > 100 
    ? blockedAttempts.slice(-100) 
    : blockedAttempts;
  
  saveToLocalStorage(BLOCKED_ATTEMPTS_KEY, trimmedAttempts);
  console.log(`Blocked booking attempt: Dr. ${doctorName} on ${attemptedDate.toLocaleDateString()} at ${attemptedTime} - ${reason}`);
};

export const getBlockedAttempts = (doctorName?: string) => {
  const blockedAttempts = getBlockedAttemptsData();
  if (doctorName) {
    return blockedAttempts.filter(attempt => attempt.doctorName === doctorName);
  }
  return blockedAttempts;
};

// Clear all blocked attempts for a specific doctor
export const clearBlockedAttempts = (doctorName?: string): number => {
  try {
    const blockedAttempts = getBlockedAttemptsData();
    let clearedCount = 0;
    
    if (doctorName) {
      // Clear only for specific doctor
      const filteredAttempts = blockedAttempts.filter(attempt => {
        if (attempt.doctorName === doctorName) {
          clearedCount++;
          return false; // Remove this attempt
        }
        return true; // Keep this attempt
      });
      saveToLocalStorage(BLOCKED_ATTEMPTS_KEY, filteredAttempts);
    } else {
      // Clear all blocked attempts
      clearedCount = blockedAttempts.length;
      saveToLocalStorage(BLOCKED_ATTEMPTS_KEY, []);
    }
    
    console.log(`🧹 Cleared ${clearedCount} blocked attempts${doctorName ? ` for Dr. ${doctorName}` : ''}`);
    return clearedCount;
  } catch (error) {
    console.error('Error clearing blocked attempts:', error);
    return 0;
  }
};

// Auto-cleanup expired unavailability slots
export const cleanupExpiredUnavailability = async (): Promise<{
  cleaned: Array<{doctorName: string; slot: UnavailableSlot}>;
  updatedDoctors: string[];
}> => {
  try {
    return await cleanupExpiredUnavailabilityInDB();
  } catch (error) {
    console.error("Error cleaning up expired unavailability:", error);
    return { cleaned: [], updatedDoctors: [] };
  }
};

// Server-side cleanup function (calls the API endpoint)
const serverSideCleanup = async (): Promise<{
  cleaned: Array<{doctorName: string; slot: any}>;
  updatedDoctors: string[];
}> => {
  try {
    console.log('🌐 Calling server-side cleanup API...');
    const response = await fetch('/api/cleanup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server cleanup failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Server cleanup result:', result);

    return {
      cleaned: result.cleaned || [],
      updatedDoctors: result.updatedDoctors || []
    };
  } catch (error) {
    console.error('❌ Server cleanup error:', error);
    // Fallback to client-side cleanup
    console.log('🔄 Falling back to client-side cleanup...');
    return await cleanupExpiredUnavailability();
  }
};

// Initialize cleanup timer (runs every 5 minutes for better testing)
if (typeof window !== 'undefined') {
  setInterval(async () => {
    const { cleaned, updatedDoctors } = await serverSideCleanup();
    if (cleaned.length > 0) {
      console.log(`⚡ Auto-cleanup completed: ${cleaned.length} expired slots removed for doctors: ${updatedDoctors.join(', ')}`);

      // Dispatch custom event to notify components about cleanup
      window.dispatchEvent(new CustomEvent('unavailabilityCleanup', {
        detail: { cleaned, updatedDoctors }
      }));
    }
  }, 5 * 60 * 1000); // Run every 5 minutes (reduced from 1 hour for better testing)
}

// Initial cleanup on load
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    const result = await serverSideCleanup();
    if (result.cleaned.length > 0) {
      console.log(`🚀 Initial cleanup: ${result.cleaned.length} expired slots removed for doctors: ${result.updatedDoctors.join(', ')}`);

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('unavailabilityCleanup', {
        detail: { cleaned: result.cleaned, updatedDoctors: result.updatedDoctors }
      }));
    }
  }, 1000);
}

// Debug function for testing (can be called from browser console)
export const debugUnavailability = async () => {
  const unavailabilityData = await getAllUnavailabilityData();
  const blockedAttempts = getBlockedAttemptsData();
  console.log('🔍 Current unavailability data:', unavailabilityData);
  console.log('🚫 Blocked attempts:', blockedAttempts);
  return { unavailabilityData, blockedAttempts };
};

// Remove all unavailability for a doctor (when admin toggles to Available)
export const removeAllDoctorUnavailability = async (doctorName: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    return await removeAllUnavailabilityForDoctor(doctorName);
  } catch (error) {
    console.error("Error removing all doctor unavailability:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Make debug functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugUnavailability = debugUnavailability;

  // Add manual cleanup trigger for testing
  (window as any).triggerCleanup = async () => {
    console.log('🔧 Manual cleanup triggered from console');
    const result = await serverSideCleanup();
    console.log('🧹 Cleanup result:', result);
    if (result.cleaned.length > 0) {
      console.log(`✅ Cleaned ${result.cleaned.length} expired slots for doctors: ${result.updatedDoctors.join(', ')}`);

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('unavailabilityCleanup', {
        detail: { cleaned: result.cleaned, updatedDoctors: result.updatedDoctors }
      }));
    } else {
      console.log('ℹ️ No expired slots found to clean up');
    }
    return result;
  };

  console.log('🔧 Debug functions available:');
  console.log('  - debugUnavailability() - Show current unavailability data');
  console.log('  - triggerCleanup() - Manually trigger cleanup');
}
