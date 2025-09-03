"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Doctors, MedicalSpecialization, Doctor } from "@/constants";
import { Button } from "@/components/ui/button";

interface DoctorFilterProps {
  onDoctorSelect: (doctorName: string) => void;
  selectedDoctor?: string;
}

const DoctorFilter = ({ onDoctorSelect, selectedDoctor }: DoctorFilterProps) => {
  const [selectedSpecialization, setSelectedSpecialization] = useState<MedicalSpecialization | "All">("All");

  // Get all unique specializations
  const specializations: (MedicalSpecialization | "All")[] = [
    "All",
    "General Medicine",
    "Cancer/Oncology",
    "Heart/Cardiology",
    "Skin/Dermatology",
    "Bone/Orthopedics",
    "Mental Health",
    "Diabetes",
    "Cold & Fever",
  ];

  // Filter doctors based on selected specialization
  const filteredDoctors = useMemo(() => {
    if (selectedSpecialization === "All") {
      return Doctors;
    }
    return Doctors.filter(doctor => 
      doctor.specializations.includes(selectedSpecialization as MedicalSpecialization)
    );
  }, [selectedSpecialization]);

  const getSpecializationColor = (spec: MedicalSpecialization | "All") => {
    const colors: Record<MedicalSpecialization | "All", string> = {
      "All": "#24AE7C",
      "General Medicine": "#3B82F6",
      "Cancer/Oncology": "#EF4444",
      "Heart/Cardiology": "#DC2626",
      "Skin/Dermatology": "#F59E0B",
      "Bone/Orthopedics": "#8B5CF6",
      "Mental Health": "#06B6D4",
      "Diabetes": "#10B981",
      "Cold & Fever": "#6366F1",
    };
    return colors[spec] || "#6B7280";
  };

  return (
    <div className="space-y-6">
      {/* Specialization Filter Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Filter by Specialization</h3>
        <div className="flex flex-wrap gap-2">
          {specializations.map((spec) => (
            <Button
              key={spec}
              variant={selectedSpecialization === spec ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSpecialization(spec)}
              style={{
                backgroundColor: selectedSpecialization === spec ? getSpecializationColor(spec) : "transparent",
                borderColor: getSpecializationColor(spec),
                color: selectedSpecialization === spec ? "white" : getSpecializationColor(spec),
              }}
              className="text-xs font-medium transition-all duration-200 hover:scale-105"
            >
              {spec}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} 
        {selectedSpecialization !== "All" && ` for ${selectedSpecialization}`}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.name}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedDoctor === doctor.name
                ? "border-green-500 bg-green-500/10"
                : "border-dark-500 bg-dark-400 hover:border-green-500/50"
            }`}
            onClick={() => onDoctorSelect(doctor.name)}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <Image
                src={doctor.image}
                alt={doctor.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              
              <div>
                <h4 className="font-semibold text-white">{doctor.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{doctor.title}</p>
                
                {/* Specializations Tags */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {doctor.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${getSpecializationColor(spec)}20`,
                        color: getSpecializationColor(spec),
                        border: `1px solid ${getSpecializationColor(spec)}40`,
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredDoctors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No doctors found for the selected specialization.</p>
          <Button
            variant="outline"
            onClick={() => setSelectedSpecialization("All")}
            className="mt-4 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
          >
            Show All Doctors
          </Button>
        </div>
      )}
    </div>
  );
};

export default DoctorFilter;
