import { motion } from 'framer-motion';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface OptimisticPostCardProps {
  name: string;
  image?: string | null;
  description?: string;
  className?: string;
}

export function OptimisticPostCard({
  name,
  image,
  description,
  className,
}: OptimisticPostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`bg-primaryWhite dark:bg-transparent rounded-2xl shadow-lg dark:shadow-none overflow-hidden border border-formColorLight/20 dark:border-0 ${className || ''}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-formColorLight/10">
        <div className="flex items-center gap-3">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-11 h-11 rounded-full object-cover border-2 border-formColorLight/30"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-linear-to-br from-formColorLight to-formColorDark flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
          )}
          <p className="font-semibold text-primaryBlack">{name}</p>
        </div>
      </div>

      <div className="relative bg-formColorLight/10 min-h-[200px] flex items-center justify-center">
        <ImageIcon className="w-16 h-16 text-formColorLight/40" />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-formColorLight/20 rounded-full text-xs text-formColorDark font-medium"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Publicando...
          </motion.span>
        </div>
        {description && (
          <p className="text-primaryBlack/70 text-sm">{description}</p>
        )}
      </div>
    </motion.div>
  );
}