"use client";

import clsx from "clsx";
import Image from "next/image";

type StatCardProps = {
  type: "appointments" | "pending" | "cancelled" | "rescheduled";
  count: number;
  label: string;
  icon: string;
};

const getCardStyles = (type: StatCardProps["type"]) => {
  const baseStyles = "relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:scale-[1.02] border";
  
  switch (type) {
    case "appointments":
      return {
        cardClass: `${baseStyles} bg-gray-900/50 border-gray-700/50 backdrop-blur-sm`,
        iconClass: "flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 mb-4",
        countClass: "text-3xl font-bold text-yellow-400 mb-1",
        labelClass: "text-sm text-gray-400 leading-relaxed",
        emoji: "📅"
      };
    case "pending":
      return {
        cardClass: `${baseStyles} bg-gray-900/50 border-gray-700/50 backdrop-blur-sm`,
        iconClass: "flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 mb-4",
        countClass: "text-3xl font-bold text-blue-400 mb-1",
        labelClass: "text-sm text-gray-400 leading-relaxed",
        emoji: "⏳"
      };
    case "cancelled":
      return {
        cardClass: `${baseStyles} bg-gray-900/50 border-gray-700/50 backdrop-blur-sm`,
        iconClass: "flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 mb-4",
        countClass: "text-3xl font-bold text-red-400 mb-1",
        labelClass: "text-sm text-gray-400 leading-relaxed",
        emoji: "⚠️"
      };
    default:
      return {
        cardClass: `${baseStyles} bg-gray-900/50 border-gray-700/50 backdrop-blur-sm`,
        iconClass: "flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 mb-4",
        countClass: "text-3xl font-bold text-green-400 mb-1",
        labelClass: "text-sm text-gray-400 leading-relaxed",
        emoji: "📋"
      };
  }
};

export const StatCard = ({ count = 0, label, icon, type }: StatCardProps) => {
  // Get the correct icon path based on type
  const getIconPath = () => {
    switch (type) {
      case 'appointments':
        return '/assets/icons/appointments.svg';
      case 'pending':
        return '/assets/icons/pending.svg';
      case 'rescheduled':
        return '/assets/icons/pending.svg';
      case 'cancelled':
        return '/assets/icons/cancelled.svg';
      default:
        return '/assets/icons/calendar.svg';
    }
  };

  // Card styling to match the reference design exactly
  const cardStyle = {
    background: 'linear-gradient(135deg, #2A3441 0%, #1F2937 50%, #111827 100%)',
    border: '1px solid rgba(55, 65, 81, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    transform: 'scale(1)',
  };

  const iconContainerStyle = {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    marginBottom: '16px',
    background: 
      type === 'appointments' ? 'rgba(251, 191, 36, 0.15)' :
      type === 'pending' ? 'rgba(59, 130, 246, 0.15)' :
      type === 'rescheduled' ? 'rgba(249, 115, 22, 0.15)' :
      'rgba(248, 113, 113, 0.15)',
    border: '1px solid ' + (
      type === 'appointments' ? 'rgba(251, 191, 36, 0.2)' :
      type === 'pending' ? 'rgba(59, 130, 246, 0.2)' :
      type === 'rescheduled' ? 'rgba(249, 115, 22, 0.2)' :
      'rgba(248, 113, 113, 0.2)'
    )
  };

  const countStyle = {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '12px',
    color: 
      type === 'appointments' ? '#FBBF24' :
      type === 'pending' ? '#3B82F6' :
      type === 'rescheduled' ? '#F97316' :
      '#F87171',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const labelStyle = {
    fontSize: '14px',
    color: '#D1D5DB',
    lineHeight: '1.4',
    fontWeight: '500'
  };
  
  return (
    <div 
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
      }}
    >
      {/* Subtle shine effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        pointerEvents: 'none'
      }} />
      
      <div style={{position: 'relative', zIndex: 10}}>
        {/* Icon */}
        <div style={iconContainerStyle}>
          <Image
            src={getIconPath()}
            alt={`${type} icon`}
            width={24}
            height={24}
            style={{
              filter: 
                type === 'appointments' ? 'brightness(0) saturate(100%) invert(78%) sepia(75%) saturate(317%) hue-rotate(1deg) brightness(101%) contrast(97%)' :
                type === 'pending' ? 'brightness(0) saturate(100%) invert(46%) sepia(98%) saturate(1988%) hue-rotate(212deg) brightness(97%) contrast(94%)' :
                type === 'rescheduled' ? 'brightness(0) saturate(100%) invert(59%) sepia(52%) saturate(2108%) hue-rotate(6deg) brightness(97%) contrast(94%)' :
                'brightness(0) saturate(100%) invert(69%) sepia(54%) saturate(4456%) hue-rotate(325deg) brightness(106%) contrast(97%)'
            }}
          />
        </div>

        {/* Count with icon */}
        <div style={countStyle}>
          <span>{count}</span>
        </div>

        {/* Label */}
        <div>
          <p style={labelStyle}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};
