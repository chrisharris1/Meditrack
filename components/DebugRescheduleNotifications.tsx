"use client";

import { useEffect, useState } from "react";
import { getAllRescheduleNotifications, clearAllRescheduleNotifications } from "@/lib/actions/reschedule.actions";

export const DebugRescheduleNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateNotifications = async () => {
      try {
        const notifications = await getAllRescheduleNotifications();
        setNotifications(notifications);
      } catch (error) {
        console.error('Error fetching notifications for debug:', error);
        setNotifications([]);
      }
    };

    updateNotifications();

    const handleUpdate = () => updateNotifications();
    window.addEventListener('rescheduleUpdated', handleUpdate);

    return () => {
      window.removeEventListener('rescheduleUpdated', handleUpdate);
    };
  }, []);

  const clearAll = async () => {
    try {
      const deletedCount = await clearAllRescheduleNotifications();
      console.log(`🧹 Cleared ${deletedCount} reschedule notifications from database`);
      window.dispatchEvent(new CustomEvent('rescheduleUpdated'));
    } catch (error) {
      console.error('Error clearing reschedule notifications:', error);
    }
  };

  if (!isVisible) {
    return (
      <div 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '12px'
        }}
      >
        Debug ({notifications.length})
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #333',
      maxWidth: '300px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ fontWeight: 'bold' }}>
          Debug: Reschedule Notifications ({notifications.length})
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            backgroundColor: 'transparent',
            color: '#888',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            width: '20px',
            height: '20px'
          }}
        >
          ×
        </button>
      </div>
      
      {notifications.length === 0 ? (
        <div style={{ color: '#888' }}>No reschedule notifications</div>
      ) : (
        notifications.map((notif, index) => (
          <div key={index} style={{ 
            marginBottom: '4px', 
            padding: '4px', 
            backgroundColor: '#333',
            borderRadius: '4px'
          }}>
            <div>ID: {notif.appointmentId?.slice(-6)}</div>
            <div>User: {notif.userId}</div>
            <div>Doctor: {notif.doctorName}</div>
            <div>Read: {notif.isRead ? 'Yes' : 'No'}</div>
          </div>
        ))
      )}
      
      <button
        onClick={clearAll}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Clear All
      </button>
    </div>
  );
};
