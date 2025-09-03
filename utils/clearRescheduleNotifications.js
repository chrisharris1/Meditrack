// Utility function to clear reschedule notifications
// You can run this in browser console if needed: clearRescheduleNotifications()

function clearRescheduleNotifications() {
  localStorage.removeItem('rescheduleNotifications');
  window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
  console.log('Cleared all reschedule notifications from localStorage');
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.clearRescheduleNotifications = clearRescheduleNotifications;
}

export { clearRescheduleNotifications };
