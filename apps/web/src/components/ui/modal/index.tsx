import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { AppModalProps } from "./types";

/**
 * Animated, backdrop-blurred modal shared by the web dialogs — the web
 * counterpart of the mobile `AppModal`. Drive it with an `open` boolean (keep
 * it mounted) so motion can play both the enter and exit transitions.
 *
 * Renders into a portal on `document.body` so it escapes any transformed /
 * overflow-clipped ancestor and always covers the viewport.
 */
export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  rightComponent,
  footer,
  children,
  className = "w-[440px]",
  contentClassName,
}: AppModalProps) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const hasHeader = Boolean(title || subtitle || icon || rightComponent);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* backdrop: dark scrim + blur (mirrors the mobile BlurView overlay) */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[85vh] max-w-full flex-col overflow-hidden rounded-2xl border border-border-alt bg-bg shadow-drag ${className}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {hasHeader && (
              <header className="flex items-center gap-4 border-b border-border px-5 py-4">
                {icon}
                <div className="min-w-0 flex-1">
                  {title && <h2 className="m-0 text-lg font-semibold text-ink">{title}</h2>}
                  {subtitle && <p className="m-0 mt-0.5 font-mono text-xs text-meta">{subtitle}</p>}
                </div>
                {rightComponent}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a7268] hover:text-ink-2"
                >
                  <X size={20} />
                </button>
              </header>
            )}

            <div className={contentClassName ?? "min-h-0 flex-1 overflow-y-auto p-5"}>
              {children}
            </div>

            {footer && (
              <footer className="flex justify-end gap-3 border-t border-border px-5 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
