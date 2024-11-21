import { type Variants } from 'framer-motion';

export const toastVariants: Variants = {
    first: {
        y: 0,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        transition: {
            ease: 'anticipate',
            duration: 0.5,
        },
    },
    second: {
        y: -16,
        opacity: 1,
        scale: 0.7,
        zIndex: 2,
        transition: {
            ease: 'linear',
            duration: 0.3,
        },
    },
    third: {
        y: -30,
        opacity: 1,
        scale: 0.4,
        zIndex: 1,
        transition: {
            ease: 'linear',
            duration: 0.3,
        },
    },
    initial: {
        y: '100%',
        opacity: 0,
    },
    exit: {
        opacity: 0,
        scale: 0,
        y: 0,
        transition: {
            ease: 'linear',
            duration: 0.2,
        },
    },
    exitFirst: {
        opacity: 0,
        transition: {
            ease: 'linear',
            duration: 0.2,
        },
    },
    exitSecond: {
        opacity: 0,
        y: -16,
        scale: 0.7,
        transition: {
            ease: 'linear',
            duration: 0.2,
        },
    },
    exitThird: {
        opacity: 0,
        y: -30,
        scale: 0.4,
        transition: {
            ease: 'linear',
            duration: 0.2,
        },
    },
};
