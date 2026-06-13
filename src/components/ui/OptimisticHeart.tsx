import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Heart, Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils';

interface OptimisticHeartProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'onClick' | 'type'> {
  liked: boolean;
  count: number;
  pending?: boolean;
  variant?: 'like' | 'favorite';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function OptimisticHeart({
  liked,
  count,
  pending = false,
  variant = 'like',
  onClick,
  disabled,
  className,
  ...props
}: OptimisticHeartProps) {
  const Icon = variant === 'like' ? Heart : Bookmark;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || pending}
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: liked ? 1.15 : 1,
        rotate: liked ? [0, -12, 12, -8, 0] : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
        duration: liked ? 0.5 : 0.2,
      }}
      className={cn(
        'flex items-center gap-1.5 transition-colors',
        liked ? 'text-likeColor' : 'text-primaryBlack/60 hover:text-likeColor',
        pending && 'opacity-60 cursor-wait',
        className
      )}
      {...props}
    >
      <motion.span
        animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon
          className={cn(
            'w-6 h-6 transition-all',
            liked && 'fill-current',
            pending && 'animate-pulse'
          )}
        />
      </motion.span>
      <span className="text-sm font-medium tabular-nums">{count}</span>
      {pending && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="text-xs text-primaryBlack/40"
        >
          ⏳
        </motion.span>
      )}
    </motion.button>
  );
}