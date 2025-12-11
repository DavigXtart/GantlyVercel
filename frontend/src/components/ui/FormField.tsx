import { useState, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  children?: ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  children,
  ariaLabel,
  ariaDescribedBy
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const inputId = `field-${name}`;
  const errorId = `error-${name}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: showError ? '#ef4444' : '#1f2937',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
      {children || (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          aria-label={ariaLabel || label}
          aria-describedby={showError ? errorId : ariaDescribedBy}
          aria-invalid={showError}
          aria-required={required}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: `2px solid ${showError ? '#ef4444' : '#e5e7eb'}`,
            background: showError ? '#fef2f2' : '#ffffff',
            color: '#1f2937',
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = showError ? '#ef4444' : '#667eea';
            e.currentTarget.style.boxShadow = showError 
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
              : '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            handleBlur(e);
            e.currentTarget.style.borderColor = showError ? '#ef4444' : '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      )}
      {showError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            fontSize: '13px',
            color: '#ef4444',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

