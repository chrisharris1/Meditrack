// components/index.ts

import { PatientFormValues } from "@/lib/validation";

export type Gender = "male" | "female" | "other";

export type IdentificationType = 
  | "Birth Certificate"
  | "Driver's License"
  | "Medical Insurance Card/Policy"
  | "Military ID Card"
  | "National Identity Card"
  | "Passport"
  | "Social Security Card"
  | "State ID Card"
  | "Student ID Card"
  | "Voter ID Card";

export type AppointmentStatus = "scheduled" | "pending" | "cancelled" | "rescheduled" | "waiting";

export type MedicalSpecialization = 
  | "General Medicine"
  | "Diabetes"
  | "Cancer/Oncology"
  | "Cold & Fever"
  | "Skin/Dermatology"
  | "Heart/Cardiology"
  | "Bone/Orthopedics"
  | "Mental Health";

export interface UnavailableSlot {
  date: Date;           // Specific date (e.g., "2025-08-25")
  startTime?: string;   // Optional start time (e.g., "14:00")
  endTime?: string;     // Optional end time (e.g., "16:00")
  reason?: string;      // Optional reason ("Surgery", "Conference", "Personal")
  isAllDay?: boolean;   // True = entire day unavailable
}

export interface Doctor {
  image: string;
  name: string;
  specializations: MedicalSpecialization[];
  title: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    daysOff: string[]; // ["Saturday", "Sunday"]
  };
  unavailableSlots?: UnavailableSlot[]; // Optional unavailable time slots
}


export const GenderOptions: Gender[] = ["male", "female", "other"];

export const PatientFormDefaultValues: Partial<PatientFormValues> = {
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "male",
  address: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  primaryPhysician: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  allergies: "",
  currentMedication: "",
  familyMedicalHistory: "",
  pastMedicalHistory: "",
  identificationType: "",
  identificationNumber: "",
  identificationDocumentId: [],
  treatmentConsent: false,
  disclosureConsent: false,
  privacyConsent: false,
};

export const IdentificationTypes: IdentificationType[] = [
  "Birth Certificate",
  "Driver's License",
  "Medical Insurance Card/Policy",
  "Military ID Card",
  "National Identity Card",
  "Passport",
  "Social Security Card",
  "State ID Card",
  "Student ID Card",
  "Voter ID Card",
];

export const Doctors: Doctor[] = [
  {
    image: "/assets/images/dr-green.png",
    name: "John Green",
    specializations: ["General Medicine", "Heart/Cardiology"],
    title: "General Practitioner & Cardiologist",
    workingHours: {
      start: "09:00",
      end: "17:00",
      daysOff: ["Sunday"]
    }
  },
  {
    image: "/assets/images/dr-cameron.png",
    name: "Leila Cameron",
    specializations: ["Cancer/Oncology", "General Medicine"],
    title: "Senior Oncologist (Extended Hours)",
    workingHours: {
      start: "08:00",
      end: "21:00", // Extended to 9 PM for cancer patients
      daysOff: ["Sunday"]
    }
  },
  {
    image: "/assets/images/dr-livingston.png",
    name: "David Livingston",
    specializations: ["Bone/Orthopedics", "General Medicine"],
    title: "Chief Orthopedic Surgeon (Extended Hours)",
    workingHours: {
      start: "10:00",
      end: "22:00", // Extended to 10 PM for emergency surgeries
      daysOff: ["Sunday"]
    }
  },
  {
    image: "/assets/images/dr-peter.png",
    name: "Evan Peter",
    specializations: ["Skin/Dermatology", "General Medicine"],
    title: "Dermatologist",
    workingHours: {
      start: "09:00",
      end: "17:00",
      daysOff: ["Wednesday", "Sunday"]
    }
  },
  {
    image: "/assets/images/dr-powell.png",
    name: "Jane Powell",
    specializations: ["Mental Health", "General Medicine"],
    title: "Psychiatrist (Evening Hours)",
    workingHours: {
      start: "11:00",
      end: "20:30", // Extended to 8:30 PM for mental health emergencies
      daysOff: ["Saturday"]
    }
  },
  {
    image: "/assets/images/dr-remirez.png",
    name: "Alex Ramirez",
    specializations: ["Diabetes", "General Medicine"],
    title: "Endocrinologist",
    workingHours: {
      start: "08:00",
      end: "16:00",
      daysOff: ["Sunday"]
    }
  },
  {
    image: "/assets/images/dr-lee.png",
    name: "Jasmine Lee",
    specializations: ["Cold & Fever", "General Medicine"],
    title: "Emergency General Practitioner",
    workingHours: {
      start: "14:00", // Afternoon/Evening shift
      end: "23:00", // Late night coverage until 11 PM
      daysOff: ["Sunday"]
    }
  },
  {
    image: "/assets/images/dr-cruz.png",
    name: "Alyana Cruz",
    specializations: ["Heart/Cardiology", "General Medicine"],
    title: "Emergency Cardiologist",
    workingHours: {
      start: "16:00", // Evening shift specialist
      end: "23:30", // Extended to 11:30 PM for cardiac emergencies
      daysOff: ["Saturday"]
    }
  },
  {
    image: "/assets/images/dr-sharma.png",
    name: "Hardik Sharma",
    specializations: ["Cancer/Oncology", "General Medicine"],
    title: "Senior Oncologist (Night Coverage)",
    workingHours: {
      start: "12:00", // Afternoon start
      end: "22:00", // Extended to 10 PM for oncology patients
      daysOff: ["Sunday"]
    }
  },
];

export const StatusIcons: Record<AppointmentStatus, string> = {
  scheduled: "/assets/icons/check.svg",
  pending: "/assets/icons/pending.svg",
  cancelled: "/assets/icons/cancelled.svg",
  rescheduled: "/assets/icons/pending.svg", // Using pending icon for rescheduled
  waiting: "/assets/icons/pending.svg", // Using pending icon for waiting
};
