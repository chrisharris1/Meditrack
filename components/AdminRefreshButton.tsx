"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const AdminRefreshButton = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force a hard refresh of the page
      router.refresh();
      
      // Also reload the page to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(55, 65, 81, 0.3)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(75, 85, 99, 0.2)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: isRefreshing ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: isRefreshing ? 0.6 : 1,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!isRefreshing) {
          e.currentTarget.style.background = 'rgba(75, 85, 99, 0.4)';
          e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isRefreshing) {
          e.currentTarget.style.background = 'rgba(55, 65, 81, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.2)';
          e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
        }
      }}
    >
      {/* Subtle shine effect - matching the Admin box */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        pointerEvents: 'none'
      }} />
      
      {/* Refresh icon with animation */}
      <span 
        style={{
          display: 'inline-block',
          transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
          transition: 'transform 1s linear',
          fontSize: '16px'
        }}
      >
        🔄
      </span>
      
      {/* Button text */}
      <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
};
