import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that adds a delay before showing loading state
 * Prevents loading flicker for fast operations
 *
 * @param isLoading - Current loading state
 * @param delay - Delay in ms before showing loading (default: 200ms)
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return showLoading;
}

/**
 * Hook that ensures loading is shown for a minimum time
 * Prevents jarring UX when loading finishes too quickly
 *
 * @param isLoading - Current loading state
 * @param minDuration - Minimum time to show loading (default: 500ms)
 */
export function useMinLoadingTime(isLoading: boolean, minDuration: number = 500): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      loadingStartRef.current = Date.now();
      setShowLoading(true);
    } else if (loadingStartRef.current) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        const timeout = setTimeout(() => {
          setShowLoading(false);
          loadingStartRef.current = null;
        }, remaining);
        return () => clearTimeout(timeout);
      } else {
        setShowLoading(false);
        loadingStartRef.current = null;
      }
    }
  }, [isLoading, minDuration]);

  return showLoading;
}

/**
 * Combined hook with both delay and minimum duration
 * Best for most loading state scenarios
 */
export function useCombinedLoading(
  isLoading: boolean,
  options: { delay?: number; minDuration?: number } = {}
): boolean {
  const { delay = 200, minDuration = 500 } = options;

  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending timeouts
    const clearTimeouts = () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
    };

    if (isLoading) {
      // Start delay timer
      delayTimeoutRef.current = setTimeout(() => {
        loadingStartRef.current = Date.now();
        setShowLoading(true);
      }, delay);
    } else {
      clearTimeouts();

      if (showLoading && loadingStartRef.current) {
        // Ensure minimum display time
        const elapsed = Date.now() - loadingStartRef.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          minTimeoutRef.current = setTimeout(() => {
            setShowLoading(false);
            loadingStartRef.current = null;
          }, remaining);
        } else {
          setShowLoading(false);
          loadingStartRef.current = null;
        }
      } else {
        setShowLoading(false);
      }
    }

    return clearTimeouts;
  }, [isLoading, delay, minDuration, showLoading]);

  return showLoading;
}

/**
 * Hook for tracking multi-step loading progress
 */
export function useLoadingProgress(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= steps.length) {
        setIsComplete(true);
      }
      return Math.min(next, steps.length - 1);
    });
  }, [steps.length]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsComplete(false);
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return {
    currentStep,
    currentStepLabel: steps[currentStep],
    progress,
    isComplete,
    nextStep,
    reset,
  };
}

/**
 * Hook that detects stuck loading states
 */
export function useLoadingWithTimeout(
  isLoading: boolean,
  timeout: number = 10000
): { isLoading: boolean; isStuck: boolean; reset: () => void } {
  const [isStuck, setIsStuck] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsStuck(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setIsStuck(true);
      }, timeout);
    } else {
      reset();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, timeout, reset]);

  return { isLoading, isStuck, reset };
}

/**
 * Debounced loading state to prevent rapid changes
 */
export function useDebouncedLoading(isLoading: boolean, debounceMs: number = 300): boolean {
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, debounceMs]);

  return debouncedLoading;
}
