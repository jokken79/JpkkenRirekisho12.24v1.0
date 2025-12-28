import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';

interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked'> {
  checked?: boolean | 'indeterminate';
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, checked, indeterminate, ...props }, ref) => {
  const isIndeterminate = indeterminate || checked === 'indeterminate';

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={isIndeterminate ? 'indeterminate' : checked}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border-2 cursor-pointer transition-all duration-150',
        'border-slate-300 bg-white',
        'hover:border-blue-500 hover:scale-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
        'data-[state=indeterminate]:bg-blue-600 data-[state=indeterminate]:border-blue-600',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-white')}
      >
        {isIndeterminate ? (
          <Minus className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Check className="h-3 w-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
