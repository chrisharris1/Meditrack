"use client";

import { useState, useEffect } from "react";
import { Doctors } from "@/constants";

interface SmartRecommendationsProps {
  reason: string;
  selectedSpecialization: string;
  doctorAvailability?: Record<string, boolean>; // Made optional since we don't use doctor blocking anymore
  onDoctorSelect?: (doctorName: string) => void;
}

export const SmartRecommendations = ({
  reason,
  selectedSpecialization,
  doctorAvailability,
  onDoctorSelect
}: SmartRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (reason.trim()) {
      // Simple recommendation logic based on symptoms
      const lowerReason = reason.toLowerCase();
      let matchedDoctors = [];

      // Filter doctors based on specialization
      let availableDoctors = Doctors;
      if (selectedSpecialization !== "All") {
        availableDoctors = Doctors.filter(doctor => 
          doctor.specializations.includes(selectedSpecialization as any)
        );
      }

      // 🆕 REMOVED: Availability filtering - all doctors are now selectable
      // availableDoctors already contains all filtered doctors

      // Simple symptom matching
      if (lowerReason.includes('heart') || lowerReason.includes('chest') || lowerReason.includes('blood pressure')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Heart/Cardiology')
        );
      } else if (lowerReason.includes('cancer') || lowerReason.includes('tumor')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Cancer/Oncology')
        );
      } else if (lowerReason.includes('bone') || lowerReason.includes('joint') || lowerReason.includes('fracture')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Bone/Orthopedics')
        );
      } else if (lowerReason.includes('skin') || lowerReason.includes('rash') || lowerReason.includes('acne')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Skin/Dermatology')
        );
      } else if (lowerReason.includes('diabetes') || lowerReason.includes('sugar')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Diabetes')
        );
      } else if (lowerReason.includes('mental') || lowerReason.includes('anxiety') || lowerReason.includes('depression')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Mental Health')
        );
      } else if (lowerReason.includes('cold') || lowerReason.includes('fever') || lowerReason.includes('flu')) {
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('Cold & Fever')
        );
      } else {
        // Default to general medicine or available doctors
        matchedDoctors = availableDoctors.filter(doctor => 
          doctor.specializations.includes('General Medicine')
        );
      }

      // If no specific matches, show all available doctors
      if (matchedDoctors.length === 0) {
        matchedDoctors = availableDoctors;
      }

      // Limit to top 3 recommendations
      setRecommendations(matchedDoctors.slice(0, 3));
    } else {
      setRecommendations([]);
    }
  }, [reason, selectedSpecialization]);

  if (recommendations.length === 0) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#1A1D21',
        border: '1px solid #363A3D',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#ABB8C4', margin: 0 }}>
          Enter your symptoms above to get smart doctor recommendations
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#131619',
      border: '1px solid #2A2D31',
      borderRadius: '12px'
    }}>
      <h4 style={{ 
        color: '#FFFFFF', 
        fontSize: '16px', 
        fontWeight: '600',
        margin: '0 0 16px 0'
      }}>
        🎯 Recommended Doctors for Your Symptoms
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((doctor, index) => (
          <div
            key={doctor.name}
            onClick={() => onDoctorSelect?.(doctor.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#1A1D21',
              border: '1px solid #363A3D',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2A2D31';
              e.currentTarget.style.borderColor = '#24AE7C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1D21';
              e.currentTarget.style.borderColor = '#363A3D';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#24AE7C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {index + 1}
            </div>
            
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
                color: '#76828D', 
                fontSize: '14px',
                marginBottom: '6px'
              }}>
                {doctor.title}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {doctor.specializations.slice(0, 2).map((spec: string) => (
                  <span
                    key={spec}
                    style={{
                      backgroundColor: '#2A2D31',
                      color: '#24AE7C',
                      border: '1px solid #363A3D',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{
              color: '#24AE7C',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Click to Select →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
