/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

declare type Gender = "male" | "female" | "other";
declare type Status = "pending" | "scheduled" | "cancelled" | "rescheduled" | "waiting";

declare interface CreateUserParams {
  name: string;
  email: string;
  phone: string;
}
declare interface User extends CreateUserParams {
  $id: string;
}

declare interface RegisterUserParams extends CreateUserParams {
  userId: string;
  birthDate: Date;
  phone: string| undefined;
  name: string| undefined;
  email: string| undefined;
  gender: Gender;
  address: string | undefined;
  occupation: string| undefined;
  emergencyContactName: string| undefined;
  emergencyContactNumber: string| undefined;
  primaryPhysician: string| undefined;
  insuranceProvider: string| undefined;
  insurancePolicyNumber: string| undefined;
  allergies: string| undefined;
  currentMedication: string| undefined;
  familyMedicalHistory: string| undefined;
  pastMedicalHistory: string| undefined;
  identificationType: string| undefined;
  identificationNumber: string| undefined;
  identificationDocument: FormData| undefined;
  privacyConsent: boolean;
  disclosureConsent: boolean;
  treatmentConsent: boolean;
}

declare type CreateAppointmentParams = {
  userId: string;
  patient: string;
  primaryPhysician: string;
  reason: string;
  schedule: Date;
  status: Status;
  note: string | undefined;
};

declare type UpdateAppointmentParams = {
  appointmentId: string;
  userId: string;
  timeZone: string;
  appointment: Appointment;
  type: string;
};