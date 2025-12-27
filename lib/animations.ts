import type { Variants, Transition } from 'framer-motion';

// Check if user prefers reduced motion
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Duration presets
export const duration = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};

// Spring config presets
export const springConfig = {
  stiff: { stiffness: 400, damping: 30 },
  bouncy: { stiffness: 300, damping: 20 },
  smooth: { stiffness: 200, damping: 25 },
  gentle: { stiffness: 100, damping: 15 },
};

// Basic animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const slideInUp: Variants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

export const slideInDown: Variants = {
  initial: { opacity: 0, y: '-100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
};

// Stagger container for children animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Interactive animations
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring', ...springConfig.smooth },
  },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: 'spring', ...springConfig.bouncy },
  },
};

export const buttonTap = {
  scale: 0.95,
};

// Shimmer loading animation (for skeletons)
export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
};

// Pulse animation
export const pulse: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.7, 1],
    scale: [1, 1.05, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
    },
  },
};

// Bounce animation
export const bounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-5, 0, -5],
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'easeInOut',
    },
  },
};

// Counter animation helper
export const counterTransition: Transition = {
  type: 'spring',
  ...springConfig.smooth,
  duration: 0.8,
};

// Get transition based on motion preference
export const getTransition = (preset: Transition = { duration: duration.normal }): Transition => {
  if (shouldReduceMotion()) {
    return { duration: 0 };
  }
  return preset;
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration.fast, ease: 'easeIn' },
  },
};

// Modal/Dialog animation
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', ...springConfig.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast },
  },
};

// Overlay backdrop
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// List item animation
export const listItemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

// Table row animation
export const tableRowVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};
