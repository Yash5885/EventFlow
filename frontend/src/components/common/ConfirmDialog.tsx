interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="rounded-md border border-border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onConfirm}
        className="focus-ring mt-4 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

