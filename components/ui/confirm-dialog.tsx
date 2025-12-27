import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconClass: 'text-red-600 bg-red-100',
    confirmClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 bg-amber-100',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-600 bg-blue-100',
    confirmClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-600 bg-emerald-100',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${config.iconClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{title}</DialogTitle>
              <DialogDescription className="text-slate-600">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={config.confirmClass}
            onClick={handleConfirm}
            disabled={isLoading || loading}
          >
            {(isLoading || loading) ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'danger',
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      variant?: 'danger' | 'warning' | 'info' | 'success';
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          title: options.title,
          description: options.description,
          variant: options.variant || 'danger',
          onConfirm: () => {
            resolve(true);
          },
        });
      });
    },
    []
  );

  const DialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState((prev) => ({ ...prev, open: false }));
          }
        }}
        title={dialogState.title}
        description={dialogState.description}
        variant={dialogState.variant}
        onConfirm={dialogState.onConfirm}
      />
    ),
    [dialogState]
  );

  return { confirm, DialogComponent };
}
