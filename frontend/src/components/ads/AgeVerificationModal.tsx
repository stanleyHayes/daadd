import { useState, useRef, type KeyboardEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  loading?: boolean;
}

export function AgeVerificationModal({ isOpen, onClose, onVerify, loading }: AgeVerificationModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otp = digits.join('');
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-warning-600" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Age Verification Required</h3>
        <p className="text-sm text-text-secondary mb-6">
          This content is age-restricted. Please enter the 6-digit verification code sent to your registered email.
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-border-color rounded-lg bg-card-bg text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={digits.some((d) => !d)}
          loading={loading}
        >
          Verify Age
        </Button>

        <p className="mt-4 text-xs text-text-muted">
          By verifying, you confirm that you meet the minimum age requirement.
        </p>
      </div>
    </Modal>
  );
}
