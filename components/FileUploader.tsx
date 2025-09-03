"use client";

import Image from "next/image";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { convertFileToUrl } from "@/lib/utils";

type FileUploaderProps = {
  files: File[] | undefined;
  onChange: (files: File[]) => void;
};

export const FileUploader = ({ files, onChange }: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onChange(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div 
      {...getRootProps()} 
      style={{
        borderRadius: '8px',
        border: '2px dashed #4B5563',
        backgroundColor: '#1A1D21',
        padding: '1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}
      className="hover:border-green-500 hover:bg-gray-900/50"
    >
      <input {...getInputProps()} />
      {files && files?.length > 0 ? (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <Image
            src={convertFileToUrl(files[0])}
            width={200}
            height={150}
            alt="uploaded image"
            style={{
              maxHeight: '150px',
              maxWidth: '200px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid #374151'
            }}
          />
          <p style={{ color: '#10B981', fontSize: '14px', marginTop: '12px', fontWeight: '500' }}>
            ✓ File uploaded successfully
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>
            {files[0].name}
          </p>
        </div>
      ) : (
        <>
          {/* Upload Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <svg 
              width="20" 
              height="20"
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <polyline 
                points="14,2 14,8 20,8" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <line 
                x1="12" 
                y1="18" 
                x2="12" 
                y2="12" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <polyline 
                points="9,15 12,12 15,15" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              color: '#FFFFFF', 
              fontSize: '16px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              <span style={{ color: '#10B981' }}>Click to upload</span> or drag and drop
            </p>
            <p style={{ 
              color: '#9CA3AF', 
              fontSize: '14px', 
              lineHeight: '1.5' 
            }}>
              SVG, PNG, JPG or GIF (max. 800x400px)
            </p>
          </div>
        </>
      )}
    </div>
  );
};


export default FileUploader