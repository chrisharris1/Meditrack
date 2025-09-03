"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Doctors } from "@/constants";
import { getAppointment } from "@/lib/actions/appointment.actions";

const RequestSuccess = ({ searchParams, params }: any) => {
  const [appointment, setAppointment] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const resolvedSearchParams = await searchParams;
        
        const userIdParam = resolvedParams?.userId || "";
        const appointmentIdParam = (resolvedSearchParams?.appointmentId as string) || "";
        const isUpdateParam = (resolvedSearchParams?.isUpdate as string) === "true";
        
        setUserId(userIdParam);
        setAppointmentId(appointmentIdParam);
        setIsUpdate(isUpdateParam);
        
        if (appointmentIdParam) {
          const appointmentData = await getAppointment(appointmentIdParam);
          setAppointment(appointmentData);
        }
      } catch (error) {
        console.error("Error loading appointment:", error);
      }
    };
    
    loadData();
  }, [params, searchParams]);

  if (!appointment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        Loading...
      </div>
    );
  }

  const doctor = Doctors.find(
    (doctor) => doctor.name === appointment.primaryPhysician
  );
  return (
    <div 
      className="bg-dark-400" 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '30px' }}>
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.jpg"
            height={40}
            width={160}
            alt="MediTrack"
            style={{ display: 'block', margin: '0 auto' }}
          />
        </Link>
      </div>

      {/* Success Icon */}
      <div style={{ marginBottom: '25px' }}>
        <Image
          src="/assets/gifs/success.gif"
          height={120}
          width={150}
          alt="Success"
          style={{ display: 'block', margin: '0 auto' }}
        />
      </div>

      {/* Main Heading */}
      <h1 
        style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '15px',
          maxWidth: '600px',
          lineHeight: '1.2'
        }}
      >
        Your <span style={{ color: '#24AE7C' }}>
          {isUpdate ? 'appointment has been successfully updated!' : 'appointment request'}
        </span> {!isUpdate && 'has been successfully submitted!'}
      </h1>

      {/* Subtitle */}
      <p 
        style={{
          color: '#ABB8C4',
          marginBottom: '40px',
          fontSize: '16px'
        }}
      >
        {isUpdate ? 'Your appointment details have been updated.' : "We'll be in touch shortly to confirm."}
      </p>

      {/* Horizontal Line */}
      <div 
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '1px',
          backgroundColor: '#363A3D',
          margin: '20px 0'
        }}
      ></div>

      {/* Appointment Details */}
      <div style={{ marginBottom: '15px' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            fontSize: '16px'
          }}
        >
          <span style={{ color: '#76828D' }}>{isUpdate ? 'Updated appointment details:' : 'Requested appointment details:'}</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src={doctor?.image!}
              alt="Doctor"
              width={24}
              height={24}
              style={{ borderRadius: '50%' }}
            />
            <span style={{ color: 'white' }}>Dr. {doctor?.name}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/assets/icons/calendar.svg"
              height={18}
              width={18}
              alt="Calendar"
            />
            <span style={{ color: 'white' }}>
              {new Date(appointment.schedule).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })} - {new Date(appointment.schedule).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Line Below */}
      <div 
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '1px',
          backgroundColor: '#363A3D',
          margin: '10px 0 30px 0'
        }}
      ></div>

      {/* New Appointment Button */}
      <div style={{ marginBottom: '40px' }}>
        <Button 
          style={{
            backgroundColor: '#24AE7C',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onClick={() => {
            // Clear any cached form data before navigating
            localStorage.removeItem('updateAppointmentData');
            window.location.href = `/patients/${userId}/new-appointment`;
          }}
        >
          New Appointment
        </Button>
      </div>

      {/* Copyright */}
      <p 
        style={{
          color: '#76828D',
          fontSize: '12px',
          margin: '0'
        }}
      >
        © 2025 MediTrack
      </p>
    </div>
  );
};

export default RequestSuccess;