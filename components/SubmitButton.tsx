import Image from "next/image";

import { Button } from "./ui/button";

interface ButtonProps {
  isLoading: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  disabledMessage?: string;
}

const SubmitButton = ({ isLoading, className, children, disabled = false, disabledMessage }: ButtonProps) => {
  const isDisabled = isLoading || disabled;
  
  return (
    <div style={{ width: '100%' }}>
      <Button
        type="submit"
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '24px',
          backgroundColor: isDisabled ? '#6B7280' : '#24AE7C',
          color: 'white',
          borderRadius: '6px',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          opacity: isDisabled ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = '#20A06B';
          }
        }}
        onMouseOut={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = '#24AE7C';
          }
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Image
              src="/assets/icons/loader.svg"
              alt="loader"
              width={20}
              height={20}
              className="animate-spin"
            />
            Loading...
          </div>
        ) : disabled ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🚫</span>
            {disabledMessage || "Cannot Submit"}
          </div>
        ) : (
          children
        )}
      </Button>
      
      {disabled && disabledMessage && (
        <p style={{
          color: '#EF4444',
          fontSize: '14px',
          marginTop: '8px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          ⚠️ {disabledMessage}
        </p>
      )}
    </div>
  );
};

export default SubmitButton;