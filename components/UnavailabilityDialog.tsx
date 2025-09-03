"use client";

import { useState } from "react";
import { Doctor, UnavailableSlot } from "@/constants";

interface UnavailabilityDialogProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: Doctor, unavailableSlot: UnavailableSlot) => void;
}

export function UnavailabilityDialog({
  doctor,
  isOpen,
  onClose,
  onSave
}: UnavailabilityDialogProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  const handleSave = () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    const unavailableSlot: UnavailableSlot = {
      date: new Date(selectedDate),
      isAllDay,
      ...(isAllDay ? {} : { startTime, endTime }),
      reason: reason || undefined
    };

    onSave(doctor, unavailableSlot);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    setIsAllDay(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1f2937 0%, #0b1220 100%)",
          border: "1px solid #374151",
          borderRadius: 16,
          padding: "24px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 25px 60px rgba(0,0,0,0.45)"
        }}
      >
        <h2 style={{
          color: "#e5e7eb",
          fontSize: "20px",
          fontWeight: "600",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          Set Unavailability - Dr. {doctor.name}
        </h2>

        {/* Date Selection */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            display: "block",
            color: "#9ca3af",
            fontSize: "14px",
            marginBottom: "8px"
          }}>
            Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: "100%",
              background: "#374151",
              border: "1px solid #4b5563",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#e5e7eb",
              fontSize: "14px"
            }}
          />
        </div>

        {/* All Day Toggle */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            color: "#e5e7eb",
            fontSize: "14px",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              style={{
                marginRight: "8px",
                width: "16px",
                height: "16px"
              }}
            />
            All Day Unavailable
          </label>
        </div>

        {/* Time Selection (only if not all day) */}
        {!isAllDay && (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px", 
              marginBottom: "16px" 
            }}>
              <div>
                <label style={{
                  display: "block",
                  color: "#9ca3af",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#374151",
                    border: "1px solid #4b5563",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e5e7eb",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  color: "#9ca3af",
                  fontSize: "14px",
                  marginBottom: "8px"
                }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#374151",
                    border: "1px solid #4b5563",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e5e7eb",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Reason Selection */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            color: "#9ca3af",
            fontSize: "14px",
            marginBottom: "8px"
          }}>
            Reason (Optional)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              background: "#374151",
              border: "1px solid #4b5563",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#e5e7eb",
              fontSize: "14px"
            }}
          >
            <option value="">Select reason...</option>
            <option value="Surgery">Surgery</option>
            <option value="Conference">Medical Conference</option>
            <option value="Training">Training/Education</option>
            <option value="Personal">Personal Time</option>
            <option value="Vacation">Vacation</option>
            <option value="Emergency">Emergency</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={handleClose}
            style={{
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Set Unavailable
          </button>
        </div>
      </div>
    </div>
  );
}
