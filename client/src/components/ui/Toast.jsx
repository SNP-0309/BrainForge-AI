import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  const icons = {
    success: <CheckCircle className="text-black shrink-0" size={18} />,
    error: <AlertCircle className="text-black shrink-0" size={18} />,
    warning: <AlertCircle className="text-black shrink-0" size={18} />,
    info: <Info className="text-black shrink-0" size={18} />,
  };

  const styles = {
    success: 'bg-brutal-green border-[3px] border-black text-black shadow-brutal',
    error: 'bg-brutal-pink border-[3px] border-black text-black shadow-brutal',
    warning: 'bg-brutal-yellow border-[3px] border-black text-black shadow-brutal',
    info: 'bg-brutal-blue border-[3px] border-black text-black shadow-brutal',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl text-black ${styles[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">
                {toast.type === 'error' ? 'Failed' : toast.type}
              </p>
              <p className="text-xs font-semibold leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-black hover:bg-black/10 shrink-0 transition-colors p-0.5 rounded border border-transparent hover:border-black"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
