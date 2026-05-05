import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          'text-sm font-semibold',
          showError ? 'text-red-500' : 'text-gantly-text'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
          aria-invalid={showError ? "true" : "false"}
          aria-required={required}
          className={cn(
            'w-full px-4 py-3 rounded-xl border text-[15px] font-body text-gantly-text',
            'transition-all duration-200 outline-none',
            'focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/10',
            showError
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
              : 'border-[var(--color-border)] bg-white'
          )}
        />
      )}
      {showError && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs text-red-500 font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
