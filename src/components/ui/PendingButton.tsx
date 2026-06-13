import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PendingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  pending?: boolean;
  success?: boolean;
  error?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'bg-linear-to-r from-formColorLight to-formColorDark text-white hover:opacity-90 shadow-lg shadow-formColor/30',
  secondary: 'bg-primaryWhite text-primaryBlack border border-formColorLight/30 hover:bg-formColorLight/20',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-primaryBlack hover:bg-formColorLight/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function PendingButton({
  children,
  pending = false,
  success = false,
  error = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: PendingButtonProps) {
  const isLoading = pending || success || error;

  return (
    <motion.button
      disabled={disabled || isLoading}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      animate={{
        boxShadow: pending ? '0 0 0 2px rgba(255, 107, 107, 0.3)' : undefined,
      }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {pending && (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      )}
      {success && <Check className="w-4 h-4 animate-scale-in" aria-hidden="true" />}
      {error && <X className="w-4 h-4 animate-shake" aria-hidden="true" />}
      {!isLoading && leftIcon}
      <span className={cn('transition-opacity', isLoading && 'opacity-0')}>
        {children}
      </span>
      {!isLoading && rightIcon}
    </motion.button>
  );
}