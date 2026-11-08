import React, { useState, useEffect } from 'react';

interface DecimalInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  unit?: string;
  showQuickHelpers?: boolean; // Shows dedicated '.' and quick adjustments for iPad users
}

/**
 * DecimalInput component designed specifically to solve iOS/iPadOS keypad limitations.
 * On iPad & iOS, type="number" virtual keypads often hide or disable decimal dots/commas.
 * This component uses type="text" with inputMode="decimal", automatically normalizes comma (,)
 * to dot (.), and provides a one-tap decimal point helper button.
 */
export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  min,
  max,
  disabled = false,
  autoFocus = false,
  required = false,
  id,
  name,
  unit,
  showQuickHelpers = true
}) => {
  // Store the raw string representation so user can type "0." without it being wiped
  const [textValue, setTextValue] = useState<string>(() => {
    if (value === '' || value === undefined || value === null) return '';
    return String(value);
  });

  // Keep in sync when parent changes external value
  useEffect(() => {
    if (value === '' || value === undefined || value === null) {
      setTextValue('');
      return;
    }
    const currentNum = parseFloat(textValue.replace(',', '.'));
    const parentNum = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));

    // Only update if mathematically different (prevents wiping trailing dots like "1.")
    if (isNaN(currentNum) || currentNum !== parentNum) {
      setTextValue(String(value));
    }
  }, [value]);

  const handleInputChange = (rawInput: string) => {
    // Normalize comma to dot for Indonesian keyboards
    let normalized = rawInput.replace(/,/g, '.');

    // Remove any character that is not a digit or decimal dot
    normalized = normalized.replace(/[^0-9.]/g, '');

    // Allow at most one decimal point
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = parts[0] + '.' + parts.slice(1).join('');
    }

    setTextValue(normalized);

    if (normalized === '' || normalized === '.') {
      onChange(0);
      return;
    }

    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) {
        // Allow typing while smaller, but pass value
        onChange(parsed);
      } else if (max !== undefined && parsed > max) {
        onChange(max);
      } else {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    // Clean up trailing dot or empty on blur
    if (textValue.endsWith('.')) {
      const clean = textValue.slice(0, -1);
      setTextValue(clean);
      const parsed = parseFloat(clean);
      onChange(isNaN(parsed) ? 0 : parsed);
    } else if (textValue === '') {
      onChange(0);
    }
  };

  // Helper to insert a decimal point directly if iPad keyboard doesn't have it
  const handleInsertDot = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!textValue.includes('.')) {
      const next = textValue === '' ? '0.' : textValue + '.';
      handleInputChange(next);
    }
  };

  // Quick adjust buttons (e.g. +0.1, -0.1, +0.5, +1)
  const handleStep = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    const current = parseFloat(textValue.replace(',', '.')) || 0;
    const next = Math.max(min !== undefined ? min : 0, Math.round((current + delta) * 100) / 100);
    handleInputChange(String(next));
  };

  return (
    <div className="relative inline-flex flex-col w-full">
      <div className="relative flex items-center w-full">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={textValue}
          onChange={e => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          className={`${className} ${unit || showQuickHelpers ? 'pr-12' : ''}`}
        />

        {/* Right side helper / Unit badge */}
        <div className="absolute right-1.5 flex items-center space-x-1">
          {unit && (
            <span className="text-[10px] text-slate-400 font-semibold px-1 select-none pointer-events-none">
              {unit}
            </span>
          )}

          {/* iPad Decimal Point Helper Button: Tapping this adds '.' seamlessly */}
          {showQuickHelpers && !textValue.includes('.') && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleInsertDot}
              title="Tombol Titik Desimal (.) Khusus Pengguna iPad"
              className="px-1.5 py-0.5 text-[10px] font-mono font-black bg-slate-200 hover:bg-red-600 hover:text-white text-slate-700 rounded transition cursor-pointer select-none"
            >
              . (koma)
            </button>
          )}
        </div>
      </div>

      {/* Mini quick decimal step pills for effortless iPad adjustment */}
      {showQuickHelpers && (
        <div className="flex items-center gap-1 mt-1 text-[9px]">
          <span className="text-slate-400 font-medium hidden sm:inline">Desimal cepat:</span>
          <button
            type="button"
            tabIndex={-1}
            onClick={e => handleStep(e, -0.1)}
            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition"
            title="Kurangi 0.1"
          >
            -0.1
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={e => handleStep(e, 0.1)}
            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition"
            title="Tambah 0.1"
          >
            +0.1
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={e => handleStep(e, 0.5)}
            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition"
            title="Tambah 0.5"
          >
            +0.5
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={e => handleStep(e, 1)}
            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold transition"
            title="Tambah 1"
          >
            +1
          </button>
        </div>
      )}
    </div>
  );
};
