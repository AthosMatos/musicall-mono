import type { ReactNode } from "react";

export type AppModalProps = {
  /** Controls mount + enter/exit animation. Keep the modal rendered and toggle this. */
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Leading element in the header (e.g. an icon or cover thumbnail). */
  icon?: ReactNode;
  /** Extra element in the header, before the close button. */
  rightComponent?: ReactNode;
  /** Sticky footer, typically the action buttons. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Extra classes for the panel (e.g. width overrides). */
  className?: string;
  /** Overrides the default body padding wrapper. */
  contentClassName?: string;
};
