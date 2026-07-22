import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  name?: string;
  id?: string;
  leftIcon?: ReactNode;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder = 'Select an option',
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  menuClassName,
  size = 'md',
  fullWidth = true,
  name,
  id,
  leftIcon,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number; placeAbove: boolean } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const selectedOption = options.find((o) => o.value === currentValue);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const commit = useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val);
      onChange?.(val);
      setOpen(false);
    },
    [isControlled, onChange]
  );

  const positionMenu = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeightEstimate = Math.min(options.length * 40 + 8, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeightEstimate + 16 && rect.top > menuHeightEstimate + 16;
    setMenuRect({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      placeAbove,
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleScroll = () => positionMenu();
    const handleResize = () => positionMenu();
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === currentValue);
      setActiveIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [open, options, currentValue]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  const handleTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => {
        let next = i + 1;
        while (next < options.length && options[next].disabled) next++;
        return next >= options.length ? i : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => {
        let next = i - 1;
        while (next >= 0 && options[next].disabled) next--;
        return next < 0 ? i : next;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(options.findIndex((o) => !o.disabled));
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setActiveIndex(i);
          break;
        }
      }
    }
  };

  const triggerSizeCls = size === 'sm' ? 'py-1.5 text-sm' : 'py-2.5 text-sm';
  const hasValue = !!selectedOption;

  return (
    <div className={cn(fullWidth && 'w-full', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-xs font-bold uppercase tracking-[0.06em] text-text-secondary"
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${selectId}-menu` : undefined}
        aria-invalid={!!error}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKey}
        className={cn(
          'relative flex min-h-[42px] items-center justify-between w-full rounded-[14px] border border-border-color bg-card-bg px-4 pr-10 text-left shadow-sm transition-all',
          triggerSizeCls,
          !disabled && 'hover:border-primary-300 cursor-pointer',
          open
            ? 'border-primary-500 ring-2 ring-primary-500/20 dark:ring-primary-400/20'
            : 'border-border-color',
          error && 'border-danger-500 focus:border-danger-500',
          disabled && 'opacity-60 cursor-not-allowed bg-bg-secondary',
          'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {leftIcon && <span className="shrink-0 text-text-muted">{leftIcon}</span>}
          <span
            className={cn(
              'truncate',
              hasValue ? 'text-text-primary' : 'text-text-muted'
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted transition-transform duration-200 pointer-events-none',
            open && 'rotate-180'
          )}
        />
      </button>

      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}

      {open && menuRect && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={`${selectId}-menu`}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleMenuKey}
            style={{
              position: 'fixed',
              top: menuRect.placeAbove ? undefined : menuRect.top,
              bottom: menuRect.placeAbove ? window.innerHeight - menuRect.top : undefined,
              left: menuRect.left,
              minWidth: menuRect.width,
              maxWidth: Math.max(menuRect.width, 280),
            }}
            className={cn(
              'z-[60] origin-top rounded-2xl border border-border-color bg-card-bg',
              'shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
              'py-1 max-h-[280px] overflow-y-auto focus:outline-none scrollbar-thin',
              'animate-scale-in',
              menuClassName
            )}
          >
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-muted">No options</div>
            )}
            {options.map((opt, i) => {
              const isSelected = opt.value === currentValue;
              const isActive = i === activeIndex;
              return (
                <button
                  key={opt.value}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && commit(opt.value)}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  className={cn(
                    'flex items-center justify-between gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed text-text-muted'
                      : 'cursor-pointer text-text-secondary',
                    !opt.disabled && isActive && 'bg-bg-secondary',
                    isSelected &&
                      'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

Select.displayName = 'Select';
