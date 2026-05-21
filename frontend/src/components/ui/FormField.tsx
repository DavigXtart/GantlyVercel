import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const showError = touched && error;
  const isPassword = type === 'password';

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
        <div className={isPassword ? 'relative' : undefined}>
          <input
            id={inputId}
            name={name}
            type={isPassword && showPassword ? 'text' : type}
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
              isPassword && 'pr-11',
              showError
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                : 'border-[var(--color-border)] bg-white'
            )}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
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
