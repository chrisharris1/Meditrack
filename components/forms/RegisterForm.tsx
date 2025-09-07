"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Form, FormControl } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import {
  Doctors,
  GenderOptions,
  IdentificationTypes,
  PatientFormDefaultValues,
} from "@/constants";
import { PatientFormValidation, PatientFormValues } from "@/lib/validation";


import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import "../../styles/datepicker.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import { FileUploader } from "../FileUploader";
import { registerPatient } from "@/lib/actions/patient.actions";
import z from "zod";



const RegisterForm = ({ user }: { user: User }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  
 const form = useForm<z.infer<typeof PatientFormValidation>>({
  resolver: zodResolver(PatientFormValidation),
  defaultValues: {
    ...PatientFormDefaultValues,
    name: user.name,
    email: user.email,
    phone: user.phone,
  },
});

  const onSubmit = async (values: PatientFormValues) => {
    setIsLoading(true);

    // Store file info in form data as
    let formData;
    if (
      values.identificationDocumentId &&
      values.identificationDocumentId?.length > 0
    ) {
      const blobFile = new Blob([values.identificationDocumentId[0]], {
        type: values.identificationDocumentId[0].type,
      });

      formData = new FormData();
      formData.append("blobFile", blobFile);
      formData.append("fileName", values.identificationDocumentId[0].name);
    }

    try {
      const patient = {
        userId: user.$id,
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthDate: new Date(values.birthDate),
        gender: values.gender,
        address: values.address,
        occupation: values.occupation,
        emergencyContactName: values.emergencyContactName,
        emergencyContactNumber: values.emergencyContactNumber,
        primaryPhysician: values.primaryPhysician,
        insuranceProvider: values.insuranceProvider,
        insurancePolicyNumber: values.insurancePolicyNumber,
        allergies: values.allergies,
        currentMedication: values.currentMedication,
        familyMedicalHistory: values.familyMedicalHistory,
        pastMedicalHistory: values.pastMedicalHistory,
        identificationType: values.identificationType,
        identificationNumber: values.identificationNumber,
        identificationDocument: values.identificationDocumentId
          ? formData
          : undefined,
        privacyConsent: values.privacyConsent,
        disclosureConsent: values.disclosureConsent,
        treatmentConsent: values.treatmentConsent,
      };

      const newPatient = await registerPatient(patient);

      if (newPatient) {
        router.push(`/patients/${user.$id}/new-appointment`);
      }
    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-5">
        <section className="space-y-3">
          <h1 className="header">Welcome 👋</h1>
          <p className="text-dark-700">Let us know more about yourself.</p>
        </section>
        
        <section className="space-y-4">
          <div className="mb-4 space-y-1">
            <h2 className="sub-header">Personal Information</h2>
          </div>
          
          {/* Full name - full width */}
          <div className="w-full">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="name"
              label="Full name"
              placeholder="Enter Your Name"
              iconSrc="/assets/icons/user.svg"
              iconAlt="user"
            />
          </div>
          
          {/* Email and Phone - two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="email"
              label="Email address"
              placeholder="Enter your Gmail"
              iconSrc="/assets/icons/email.svg"
              iconAlt="email"
            />
            <CustomFormField
              fieldType={FormFieldType.PHONE_INPUT}
              control={form.control}
              name="phone"
              label="Phone Number"
              placeholder="Enter your Number"
            />
          </div>
          
          {/* Date of birth and Gender - two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="birthDate"
              label="Date of birth"
            />
            <CustomFormField
              fieldType={FormFieldType.SKELETON}
              control={form.control}
              name="gender"
              label="Gender"
              renderSkeleton={(field) => (
                <FormControl>
                  <div 
                    className="flex gap-4 justify-start items-center" 
                    style={{ 
                      display: 'flex',
                      flexWrap: 'nowrap',
                      width: '100%',
                      overflow: 'visible'
                    }}
                  >
                    {GenderOptions.map((option, i) => (
                      <div 
                        key={option + i} 
                        className="radio-group" 
                        style={{
                          display: 'flex',
                          height: '36px',
                          flex: 'none',
                          minWidth: 'fit-content',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '6px',
                          border: field.value === option ? '1px solid #24AE7C' : '1px solid #363A3D',
                          backgroundColor: field.value === option ? 'rgba(36, 174, 124, 0.1)' : '#1A1D21',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          marginRight: i < GenderOptions.length - 1 ? '16px' : '0'
                        }} 
                        onClick={() => field.onChange(option)}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={field.value === option}
                          onChange={() => field.onChange(option)}
                          style={{
                            appearance: 'none',
                            width: '14px',
                            height: '14px',
                            border: field.value === option ? '2px solid #24AE7C' : '2px solid #363A3D',
                            borderRadius: '50%',
                            background: field.value === option ? '#24AE7C' : 'transparent',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                          }}
                        />
                        <label 
                          htmlFor={option} 
                          className="cursor-pointer text-white text-14-medium select-none"
                          onClick={() => field.onChange(option)}
                          style={{ 
                            fontSize: '14px',
                            flexShrink: 0
                          }}
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
              )}
            />
          </div>
          
          {/* Address and Occupation - two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="address"
              label="Address"
              placeholder="Enter Your Address"
            />
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="occupation"
              label="Occupation"
              placeholder="Ex : Software Engineer"
            />
          </div>
          
          {/* Emergency contact - two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="emergencyContactName"
              label="Emergency contact name"
              placeholder="Guardian's name"
            />
            <CustomFormField
              fieldType={FormFieldType.PHONE_INPUT}
              control={form.control}
              name="emergencyContactNumber"
              label="Emergency contact number"
              placeholder="Enter a number"
            />
          </div>
        </section>
        <section className="space-y-6">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-2">Medical Information</h2>
          </div>
          
          {/* Primary care physician - full width */}
          <div className="w-full">
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="primaryPhysician"
              label="Primary care physician"
              placeholder="Dr. Adam Smith"
            >
              {Doctors.map((doctor, i) => (
                <SelectItem key={doctor.name + i} value={doctor.name}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 0',
                      width: '100%'
                    }}
                  >
                    <Image
                      src={doctor.image}
                      width={30}
                      height={30}
                      alt="doctor"
                      style={{
                        borderRadius: '50%',
                        border: '1px solid #363A3D',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ color: 'white', fontSize: '18px', lineHeight: '1.2' }}>
                      {doctor.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </CustomFormField>
          </div>
          
          {/* Insurance provider and policy number - two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="insuranceProvider"
              label="Insurance provider"
              placeholder="ex. BlueCross"
            />
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="insurancePolicyNumber"
              label="Insurance policy number"
              placeholder="ex. ABC123456"
            />
          </div>
          
          {/* Allergies and Current medications - two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="allergies"
              label="Allergies (if any)"
              placeholder="ex. Peanuts, Penicillin, Pollen"
            />
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="currentMedication"
              label="Current medications"
              placeholder="ex. Ibuprofen 200mg, Levothyroxine 50mcg"
            />
          </div>
          
          {/* Family medical history and Past medical history - two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="familyMedicalHistory"
              label="Family medical history (if relevant)"
              placeholder="ex. Mother had breast cancer"
            />
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="pastMedicalHistory"
              label="Past medical history"
              placeholder="ex. Asthma diagnosis in childhood"
            />
          </div>
        </section>
        <section className="space-y-6">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-2">Identification and Verification</h2>
          </div>
          
          {/* Identification type - dropdown */}
          <div className="space-y-2">
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="identificationType"
              label="Identification type"
              placeholder="Birth Certificate"
            >
              {IdentificationTypes.map((type, i) => (
                <SelectItem key={type + i} value={type}>
                  {type}
                </SelectItem>
              ))}
            </CustomFormField>
          </div>
          
          {/* Identification number */}
          <div className="space-y-2">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="identificationNumber"
              label="Identification Number"
              placeholder="1234567"
            />
          </div>
          
          {/* Document upload - full width */}
          <div className="space-y-2">
            <CustomFormField
              fieldType={FormFieldType.SKELETON}
              control={form.control}
              name="identificationDocumentId"
              label="Scanned Copy of Identification Document"
              renderSkeleton={(field) => (
                <FormControl>
                  <FileUploader files={field.value} onChange={field.onChange} />
                </FormControl>
              )}
            />
          </div>
        </section>

        <section className="space-y-6" style={{ marginTop: '3rem' }}>
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-2">Consent and Privacy</h2>
          </div>
          
          <div className="space-y-4" style={{ marginBottom: '48px' }}>
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="treatmentConsent"
              label="I consent to receive treatment for my health condition."
            />
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="disclosureConsent"
              label="I consent to the use and disclosure of my health information for treatment purposes."
            />
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="privacyConsent"
              label="I acknowledge that I have reviewed and agree to the privacy policy"
            />
          </div>
        </section>

        <div style={{ marginTop: '32px', paddingTop: '16px', marginBottom: '48px' }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#10B981',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }}
            className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Loading...
              </div>
            ) : (
              'Submit and Continue'
            )}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default RegisterForm;