import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Select component that always opens downwards.
 * Drop-in replacement for native <select> with consistent styling.
 *
 * Props:
 *   value: string | number          — current selected value
 *   onChange: (value) => void       — called with the new value
 *   options: [{ value, label }]     — dropdown options
 *   placeholder: string             — shown when value is empty
 *   ariaLabel: string               — accessibility label
 *   id: string                      — optional id for the trigger button (for <label htmlFor>)
 *   className: string               — additional classes for the trigger
 *   disabled: bool
 */
export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  ariaLabel,
  id,
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => String(o.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex];
    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value);
            setOpen(false);
          }
          break;
        default:
          break;
      }
    },
    [open, highlightedIndex, options, onChange]
  );

  return (
    <div ref={containerRef} className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full h-10 px-3 pr-8 rounded border border-outline bg-surface text-body-md text-left focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors cursor-pointer flex items-center justify-between gap-2 ${className}`}
      >
        <span className={`truncate ${selectedOption ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-outline shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface border border-surface-border rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-body-sm text-on-surface-variant text-center">No options</li>
          ) : (
            options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 text-body-sm cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isHighlighted ? 'bg-primary/5' : ''
                  } ${isSelected ? 'text-primary font-medium' : 'text-on-surface'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-primary shrink-0" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
