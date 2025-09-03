"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { encryptKey } from "@/lib/utils";


export const PasskeyModal = () => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<number | null>(null);

  const closeModal = () => {
    setOpen(false);
    router.push("/");
  };

  const validatePasskey = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();

    if (passkey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
      const encryptedKey = encryptKey(passkey);
      localStorage.setItem("accessKey", encryptedKey);
      setOpen(false);
      router.push("/admin");
    } else {
      setError("Invalid passkey. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newPasskey = passkey.split('');
    newPasskey[index] = value;
    setPasskey(newPasskey.join(''));
    
    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !passkey[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '12px',
          minWidth: '400px',
          maxWidth: '500px',
          border: '1px solid #374151',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            Admin Access Verification
          </h2>
          <button
            onClick={closeModal}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Description */}
        <p style={{ 
          color: '#9ca3af', 
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          To access the admin page, please enter the passkey.
        </p>
        
        {/* OTP Inputs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          justifyContent: 'center'
        }}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={passkey[index] || ''}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              maxLength={1}
              style={{
                width: '3rem',
                height: '3rem',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '600',
                backgroundColor: passkey[index] ? '#065f46' : '#374151',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: focusedInput === index || passkey[index] ? '#10b981' : '#4b5563',
                borderRadius: '0.5rem',
                color: 'white',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: focusedInput === index ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none'
              }}
              onFocus={() => setFocusedInput(index)}
              onBlur={() => setFocusedInput(null)}
            />
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <p style={{ 
            color: '#ef4444', 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </p>
        )}
        
        {/* Button */}
        <button 
          onClick={(e) => validatePasskey(e)}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          Enter Admin Passkey
        </button>
      </div>
    </div>
  );
};