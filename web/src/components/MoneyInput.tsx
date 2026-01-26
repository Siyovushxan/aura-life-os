import React, { useEffect, useState } from 'react';

interface MoneyInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

export function MoneyInput({ value, onChange, placeholder, className, autoFocus }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // Sync external value to display value on mount or when value changes externally
    useEffect(() => {
        if (value === 0 && displayValue === '') return; // Don't overwrite empty state with 0 initially if desired
        if (parseNumber(displayValue) !== value) {
            setDisplayValue(formatNumber(value));
        }
    }, [value]);

    const formatNumber = (num: number): string => {
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const parseNumber = (str: string): number => {
        return Number(str.replace(/\s/g, ""));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow only numbers and spaces
        const filtered = raw.replace(/[^0-9\s]/g, '');
        const num = parseNumber(filtered);

        // Prevent huge numbers that break JS
        if (num > 999999999999) return;

        setDisplayValue(filtered);
        onChange(num);
    };

    const handleBlur = () => {
        // Re-format on blur to ensure clean spacing
        const num = parseNumber(displayValue);
        setDisplayValue(formatNumber(num));
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
            autoFocus={autoFocus}
        />
    );
}

export default MoneyInput;
