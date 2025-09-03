"use client";

import Image from "next/image";
import { ENHANCED_DOCTORS } from "@/lib/recommendations";

interface DoctorCardProps {
  doctorName: string;
  showDetails?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DoctorCard = ({ 
  doctorName, 
  showDetails = false, 
  isSelected = false,
  onClick 
}: DoctorCardProps) => {
  const doctor = ENHANCED_DOCTORS.find(d => d.name === doctorName);
  
  if (!doctor) return null;

  const { rating, reviewCount, experience, successRate, awards, languages, consultationFee } = doctor;

  return (
    <div 
      className={`doctor-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Doctor Image & Basic Info */}
      <div className="doctor-header">
        <div className="doctor-image-container">
          <Image
            src={doctor.image}
            alt={doctor.name}
            width={80}
            height={80}
            className="doctor-image"
          />
          {awards.length > 0 && (
            <div className="awards-badge">
              🏆 {awards.length}
            </div>
          )}
        </div>
        
        <div className="doctor-info">
          <h3 className="doctor-name">Dr. {doctor.name}</h3>
          <p className="doctor-title">{doctor.title}</p>
          
          {/* Rating & Reviews */}
          <div className="rating-section">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`star ${i < Math.floor(rating) ? 'filled' : 'empty'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">
              {rating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="specializations">
        {doctor.specializations.map((spec, index) => (
          <span key={index} className="specialization-tag">
            {spec}
          </span>
        ))}
      </div>

      {/* Working Hours */}
      <div className="working-hours">
        <span className="hours-icon">🕐</span>
        <span className="hours-text">
          {doctor.workingHours.start} - {doctor.workingHours.end}
        </span>
        {doctor.workingHours.daysOff.length > 0 && (
          <span className="days-off">
            🚫 {doctor.workingHours.daysOff.join(', ')}
          </span>
        )}
      </div>

      {/* Detailed Information (when showDetails is true) */}
      {showDetails && (
        <div className="doctor-details">
          {/* Experience & Success Rate */}
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Experience</span>
              <span className="stat-value">{experience}+ years</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Success Rate</span>
              <span className="stat-value">{successRate}%</span>
            </div>
          </div>

          {/* Languages */}
          <div className="languages-section">
            <span className="section-label">Languages:</span>
            <div className="language-tags">
              {languages.map((lang, index) => (
                <span key={index} className="language-tag">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Awards */}
          {awards.length > 0 && (
            <div className="awards-section">
              <span className="section-label">Awards:</span>
              <div className="awards-list">
                {awards.map((award, index) => (
                  <span key={index} className="award-item">
                    🏆 {award}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Consultation Fee */}
          <div className="fee-section">
            <span className="fee-label">Consultation Fee:</span>
            <span className="fee-amount">₹{consultationFee}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .doctor-card {
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          border: 1px solid rgba(55, 65, 81, 0.3);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .doctor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border-color: rgba(36, 174, 124, 0.3);
        }

        .doctor-card.selected {
          border-color: #24AE7C;
          background: linear-gradient(135deg, #1F2937 0%, #0F172A 100%);
          box-shadow: 0 0 20px rgba(36, 174, 124, 0.3);
        }

        .doctor-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .doctor-image-container {
          position: relative;
          flex-shrink: 0;
        }

        .doctor-image {
          border-radius: 12px;
          border: 2px solid rgba(55, 65, 81, 0.3);
          transition: border-color 0.3s ease;
        }

        .doctor-card:hover .doctor-image {
          border-color: rgba(36, 174, 124, 0.5);
        }

        .awards-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
        }

        .doctor-info {
          flex: 1;
          min-width: 0;
        }

        .doctor-name {
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }

        .doctor-title {
          color: #9CA3AF;
          font-size: 14px;
          margin: 0 0 12px 0;
          line-height: 1.3;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          font-size: 16px;
          transition: color 0.2s ease;
        }

        .star.filled {
          color: #F59E0B;
        }

        .star.empty {
          color: #374151;
        }

        .rating-text {
          color: #9CA3AF;
          font-size: 12px;
          font-weight: 500;
        }

        .specializations {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .specialization-tag {
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.2s ease;
        }

        .specialization-tag:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .working-hours {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(55, 65, 81, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(75, 85, 99, 0.2);
        }

        .hours-icon {
          font-size: 16px;
        }

        .hours-text {
          color: #D1D5DB;
          font-size: 13px;
          font-weight: 500;
        }

        .days-off {
          color: #EF4444;
          font-size: 12px;
          font-weight: 500;
          margin-left: auto;
        }

        .doctor-details {
          border-top: 1px solid rgba(75, 85, 99, 0.2);
          padding-top: 16px;
          margin-top: 16px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 12px;
          background: rgba(55, 65, 81, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(75, 85, 99, 0.2);
        }

        .stat-label {
          display: block;
          color: #9CA3AF;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          color: #24AE7C;
          font-size: 16px;
          font-weight: 700;
        }

        .section-label {
          display: block;
          color: #9CA3AF;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .languages-section,
        .awards-section {
          margin-bottom: 16px;
        }

        .language-tags,
        .awards-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .language-tag {
          background: rgba(168, 85, 247, 0.1);
          color: #A78BFA;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .award-item {
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .fee-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(36, 174, 124, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(36, 174, 124, 0.2);
        }

        .fee-label {
          color: #9CA3AF;
          font-size: 12px;
          font-weight: 500;
        }

        .fee-amount {
          color: #24AE7C;
          font-size: 18px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
