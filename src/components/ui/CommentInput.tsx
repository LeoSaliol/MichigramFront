import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  currentPetImage?: string | null;
  currentPetName?: string;
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  pending = false,
  disabled,
  placeholder = 'Agrega un comentario...',
  currentPetImage,
  currentPetName,
}: CommentInputProps) {
  const [inputHeight, setInputHeight] = useState(44);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const height = Math.min(textareaRef.current.scrollHeight, 120);
      setInputHeight(height);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setTimeout(adjustHeight, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !pending && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex items-end gap-2">
      {currentPetImage ? (
        <img
          src={currentPetImage}
          alt={currentPetName || ''}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : currentPetName ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {currentPetName[0]}
        </div>
      ) : null}
      <div className="flex-1 flex items-end gap-2 bg-formColorLight/10 rounded-xl px-3 py-1.5">
        <motion.textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || pending}
          rows={1}
          style={{ height: inputHeight, minHeight: 44, maxHeight: 120 }}
          className="flex-1 bg-transparent text-sm text-primaryBlack placeholder-primaryBlack/40 outline-none resize-none pr-8"
          aria-label="Comentario"
        />
        <motion.button
          onClick={onSubmit}
          disabled={!value.trim() || pending || disabled}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: pending ? 360 : 0 }}
          transition={{ duration: pending ? 1 : 0.2, repeat: pending ? Infinity : 0, ease: 'linear' }}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg transition-colors',
            'text-formColorDark hover:text-redPink',
            'disabled:text-primaryBlack/20 disabled:cursor-not-allowed'
          )}
          aria-label="Enviar comentario"
        >
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
      {pending && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-primaryBlack/40 whitespace-nowrap"
        >
          Enviando...
        </motion.span>
      )}
    </div>
  );
}