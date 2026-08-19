import { useState, forwardRef } from 'react';

export const CurrencyInput = forwardRef(function CurrencyInput({ value, onChange, placeholder = '0.00', ...props }, ref) {
  const [focused, setFocused] = useState(false);
  const num = Number(value);
  const display = focused || value === '' || Number.isNaN(num)
    ? value
    : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);

  return (
    <div className="relative">
      <input
        ref={ref}
        type="number"
        step="0.01"
        min="0"
        value={focused ? value : display}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (onChange) onChange(value);
        }}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
        {...props}
      />
    </div>
  );
});
