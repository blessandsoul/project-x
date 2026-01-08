import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// FilterSection - Collapsible accordion section with animation
// ============================================================================

export interface FilterSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Content to render inside the section */
  children: React.ReactNode;
  /** Whether the section is open by default */
  defaultOpen?: boolean;
}

export function FilterSection({
  title,
  children,
  defaultOpen = true
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (isOpen) {
      const contentEl = contentRef.current;
      if (contentEl) {
        setHeight(contentEl.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setHeight(undefined), 200);
        return () => clearTimeout(timer);
      }
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
          {title}
        </span>
        <Icon
          icon="mdi:chevron-down"
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ height: height === undefined ? 'auto' : height }}
      >
        <div ref={contentRef} className="px-2 py-2 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FilterCheckboxItem - Styled checkbox item for filter lists
// ============================================================================

export interface FilterCheckboxItemProps {
  /** Label text for the checkbox */
  label: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Additional className for the label wrapper */
  className?: string;
}

export function FilterCheckboxItem({
  label,
  checked,
  onCheckedChange,
  className,
}: FilterCheckboxItemProps) {
  return (
    <label className={cn(
      "flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded",
      className
    )}>
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        className="h-3.5 w-3.5 rounded-sm border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
      <span className="text-[11px] text-slate-700">{label}</span>
    </label>
  );
}

// ============================================================================
// FilterRangeInputs - Side-by-side "from / to" input pair
// ============================================================================

export interface FilterRangeInputsProps {
  /** Value for the "from" input */
  fromValue: string;
  /** Value for the "to" input */
  toValue: string;
  /** Callback when "from" value changes */
  onFromChange: (value: string) => void;
  /** Callback when "to" value changes */
  onToChange: (value: string) => void;
  /** Callback when either input loses focus */
  onBlur?: () => void;
  /** Callback when Enter key is pressed */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Placeholder for "from" input */
  fromPlaceholder?: string;
  /** Placeholder for "to" input */
  toPlaceholder?: string;
  /** Input type (text, number, date) */
  type?: 'text' | 'number' | 'date';
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'numeric' | 'decimal';
  /** Max length for inputs */
  maxLength?: number;
  /** Whether to show currency prefix ($) */
  showCurrencyPrefix?: boolean;
}

export function FilterRangeInputs({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onBlur,
  onKeyDown,
  fromPlaceholder,
  toPlaceholder,
  type = 'text',
  inputMode = 'numeric',
  maxLength,
  showCurrencyPrefix = false,
}: FilterRangeInputsProps) {
  const { t } = useTranslation();

  // Sharp inputs (rounded-none) to match auction-listings filter panel design
  const inputClassName = "h-7 text-[10px] px-2 bg-white border-slate-300 flex-1 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-none";
  const currencyInputClassName = "h-7 text-[10px] pl-4 pr-1 bg-white border-slate-300 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary w-full shadow-none";

  if (showCurrencyPrefix) {
    return (
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
          <Input
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            placeholder={fromPlaceholder || t('common.from')}
            value={fromValue}
            onChange={(e) => onFromChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={currencyInputClassName}
          />
        </div>
        <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
        <div className="relative flex-1">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
          <Input
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            placeholder={toPlaceholder || t('common.to')}
            value={toValue}
            onChange={(e) => onToChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className={currencyInputClassName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={fromPlaceholder || t('common.from')}
        value={fromValue}
        onChange={(e) => onFromChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
      <Input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={toPlaceholder || t('common.to')}
        value={toValue}
        onChange={(e) => onToChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
    </div>
  );
}

// ============================================================================
// FiltersSidebarLayout - Main layout wrapper for filter sidebars
// ============================================================================

export interface FiltersSidebarLayoutProps {
  /** Title displayed in the blue header */
  title?: string;
  /** Filter sections content */
  children: React.ReactNode;
  /** Text for the apply button */
  applyButtonText?: string;
  /** Text for the reset button */
  resetButtonText?: string;
  /** Callback when apply button is clicked */
  onApply?: () => void;
  /** Callback when reset button is clicked */
  onReset?: () => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Additional className for the container */
  className?: string;
}

export function FiltersSidebarLayout({
  title,
  children,
  applyButtonText,
  resetButtonText,
  onApply,
  onReset,
  showActions = true,
  className,
}: FiltersSidebarLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("bg-white border border-slate-300 text-[11px]", className)}>
      {/* Blue Header */}
      <div className="flex items-center gap-1.5 px-2 py-2 bg-primary text-white">
        <Icon icon="mdi:filter-variant" className="w-3.5 h-3.5" />
        <span className="font-semibold text-[11px] uppercase tracking-wide">
          {title || t('auction.filters.refine')}
        </span>
      </div>

      {/* Filter Sections */}
      {children}

      {/* Action Buttons */}
      {showActions && (
        <div className="p-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
          <Button
            className="w-full h-7 text-[10px] bg-accent hover:bg-accent/90 text-primary font-bold"
            onClick={onApply}
          >
            {applyButtonText || t('auction.filters.apply')}
          </Button>
          <Button
            variant="outline"
            className="w-full h-7 text-[10px] border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={onReset}
          >
            {resetButtonText || t('common.clear_all')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FilterSelect - Styled select dropdown for filters
// ============================================================================

export interface FilterSelectProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Options to display */
  options: Array<{ value: string; label: string }>;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  disabled,
  className,
}: FilterSelectProps) {
  // Filter out any options with empty string values to prevent Radix UI Select error
  const validOptions = options.filter(opt => opt.value !== '');

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-7 w-full text-[10px] px-2 bg-white border-slate-300 rounded-none focus:ring-1 focus:ring-primary focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-none",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// FilterInput - Styled text input for filters
// ============================================================================

export interface FilterInputProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Callback when key is pressed */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Input type */
  type?: 'text' | 'number' | 'date';
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'numeric' | 'decimal';
  /** Max length */
  maxLength?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Icon to show on the left */
  icon?: string;
  /** Additional className */
  className?: string;
}

export function FilterInput({
  value,
  onChange,
  placeholder,
  onBlur,
  onKeyDown,
  type = 'text',
  inputMode,
  maxLength,
  disabled,
  icon,
  className,
}: FilterInputProps) {
  // Sharp input (rounded-none) to match auction-listings filter panel design
  const inputClassName = cn(
    "h-7 w-full text-[10px] bg-white border-slate-300 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-none",
    icon ? "pl-7 pr-2" : "px-2",
    className
  );

  return (
    <div className="relative">
      {icon && (
        <Icon
          icon={icon}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10"
        />
      )}
      <Input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={inputClassName}
      />
    </div>
  );
}

// Export all components
export default FiltersSidebarLayout;
