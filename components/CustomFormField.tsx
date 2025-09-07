import { E164Number } from "libphonenumber-js/core";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Control } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";
import { Doctors } from "@/constants";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";


export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATE_PICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
}

interface CustomProps {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTimeSelect?: boolean;
  minDate?: Date;
  children?: React.ReactNode;
  renderSkeleton?: (field: any) => React.ReactNode;
  fieldType: FormFieldType;
}

const RenderInput = ({ field, props }: { field: any; props: CustomProps }) => {
  switch (props.fieldType) {
    case FormFieldType.INPUT:
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          borderRadius: '6px', 
          border: '1px solid #363A3D', 
          backgroundColor: '#1A1D21', 
          height: '44px',
          marginBottom: '16px'
        }}>
          {props.iconSrc && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingLeft: '12px', 
              paddingRight: '8px' 
            }}>
              <Image
                src={props.iconSrc}
                height={20}
                width={20}
                alt={props.iconAlt || "icon"}
                style={{ opacity: 0.6 }}
              />
            </div>
          )}
          <FormControl>
            <Input
              placeholder={props.placeholder}
              {...field}
              style={{ 
                border: 'none', 
                backgroundColor: 'transparent !important', 
                height: '44px', 
                color: 'white', 
                outline: 'none',
                padding: '0 50px',
                fontSize: '14px',
                boxShadow: 'none !important'
              }}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'transparent';
                target.style.boxShadow = 'none';
              }}
              onBlur={(e) => {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'transparent';
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'transparent';
              }}
            />
          </FormControl>
        </div>
      );
    
      case FormFieldType.TEXTAREA:
      return (
        <div style={{
          borderRadius: '6px',
          border: '1px solid #363A3D',
          backgroundColor: '#1A1D21',
          marginBottom: '16px',
          padding: '12px',
          position: 'relative'
        }}>
          <FormControl>
            <Textarea
              placeholder={props.placeholder}
              {...field}
              disabled={props.disabled}
              className="custom-textarea"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '14px',
                resize: 'none',
                minHeight: '100px',
                maxHeight: '100px',
                boxShadow: 'none',
                width: '100%',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          </FormControl>
        </div>
      )

    case FormFieldType.PHONE_INPUT:
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          borderRadius: '6px', 
          border: '1px solid #363A3D', 
          backgroundColor: '#1A1D21', 
          height: '44px',
          paddingLeft: '12px',
          paddingRight: '12px',
          marginBottom: '16px'
        }}>
          <FormControl>
            <PhoneInput
              defaultCountry="IN"
              placeholder={props.placeholder}
              international
              withCountryCallingCode
              value={field.value as E164Number | undefined}
              onChange={field.onChange}
              className="phone-input-custom"
            />
          </FormControl>
        </div>
      );
    
      case FormFieldType.CHECKBOX:
      return (
        <FormControl>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '8px 0'
          }}>
            <div
              onClick={() => field.onChange(!field.value)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: field.value ? '2px solid #10B981' : '2px solid #4B5563',
                backgroundColor: field.value ? '#10B981' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              {field.value && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="20,6 9,17 4,12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <label
              htmlFor={props.name}
              onClick={() => field.onChange(!field.value)}
              style={{
                color: '#E5E7EB',
                fontSize: '14px',
                lineHeight: '1.5',
                cursor: 'pointer',
                userSelect: 'none',
                flex: 1
              }}
            >
              {props.label}
            </label>
          </div>
        </FormControl>
      );

    case FormFieldType.DATE_PICKER:
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '6px',
          border: '1px solid #363A3D',
          backgroundColor: '#1A1D21',
          height: '44px',
          paddingLeft: '12px',
          paddingRight: '12px',
          marginBottom: '16px'
        }}>
          <Image
            src="/assets/icons/calendar.svg"
            height={20}
            width={20}
            alt="calendar"
            style={{ opacity: 0.6, marginRight: '8px' }}
          />
          <FormControl>
            <DatePicker
              showTimeSelect={props.showTimeSelect ?? false}
              selected={field.value ? new Date(field.value) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  // If showTimeSelect is true, preserve the full datetime, otherwise just date
                  if (props.showTimeSelect) {
                    field.onChange(date); // Keep as Date object for full datetime
                  } else {
                    const dateString = date.toISOString().split('T')[0];
                    field.onChange(dateString);
                  }
                } else {
                  field.onChange("");
                }
              }}
              timeInputLabel="Time:"
              dateFormat={props.dateFormat ?? "MM/dd/yyyy"}
              wrapperClassName="date-picker"
              className="date-picker-input"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearDropdownItemNumber={100}
              scrollableYearDropdown
              popperPlacement="top"
              autoComplete="off"
              minDate={props.minDate}
            />
          </FormControl>
        </div>
      );
   
      case FormFieldType.SELECT:
      // Find the selected doctor to display image
      const selectedDoctor = props.name === 'primaryPhysician' && field.value
        ? Doctors.find(doctor => doctor.name === field.value)
        : null;
      
      return (
        <div 
          id={`select-container-${props.name}`}
          style={{
            borderRadius: '16px',
            border: '1px solid #363A3D',
            backgroundColor: '#1A1D21',
            minHeight: '56px',
            marginBottom: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger 
                  onFocus={() => {
                    const container = document.getElementById(`select-container-${props.name}`);
                    if (container) {
                      container.style.borderColor = '#24AE7C';
                      container.style.boxShadow = '0 0 0 1px #24AE7C';
                    }
                  }}
                  onBlur={() => {
                    const container = document.getElementById(`select-container-${props.name}`);
                    if (container) {
                      container.style.borderColor = '#363A3D';
                      container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    minHeight: '56px',
                    padding: '18px 50px 18px 20px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {field.value ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      maxWidth: '90%'
                    }}>
                      {/* Show doctor in a pill/box container */}
                      {selectedDoctor ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#374151',
                          borderRadius: '20px',
                          padding: '4px 8px 4px 4px',
                          border: '1px solid #4B5563'
                        }}>
                          <Image
                            src={selectedDoctor.image}
                            width={16}
                            height={16}
                            alt="doctor"
                            style={{
                              borderRadius: '50%',
                              flexShrink: 0
                            }}
                          />
                          <span style={{
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}>
                            {field.value}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          color: 'white',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {field.value}
                        </span>
                      )}
                    </div>
                  ) : (
                    <SelectValue 
                      placeholder={props.placeholder}
                      style={{ 
                        color: '#6B7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '90%'
                      }}
                    />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent 
                style={{
                  backgroundColor: '#1A1D21',
                  border: '1px solid #363A3D',
                  borderRadius: '6px',
                  zIndex: 99999,
                  position: 'fixed',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 #1A1D21',
                  minWidth: '400px',  // Minimum width to prevent text cutoff
                  maxWidth: '500px',  // Maximum width for responsive design
                  width: 'max-content' // Adjust width based on content
                }}
              >
                {props.children}
              </SelectContent>
            </Select>
          </FormControl>
        </div>
      );

    case FormFieldType.SKELETON:
      return props.renderSkeleton ? props.renderSkeleton(field) : null;
    default:
      return null;
  }
};

const CustomFormField = (props: CustomProps) => {
  const { control, name, label } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          {props.fieldType !== FormFieldType.CHECKBOX && label && (
            <FormLabel 
              className="text-14-medium block"
              style={{ 
                marginBottom: '12px', 
                display: 'block',
                color: '#9CA3AF',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {label}
            </FormLabel>
          )}
          <RenderInput field={field} props={props} />

          <FormMessage className="shad-error" />
        </FormItem>
      )}
    />
  );
};

export default CustomFormField;
