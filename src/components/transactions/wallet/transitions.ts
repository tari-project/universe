export const walletTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: 'easeInOut' },
    style: { width: '100%', maxHeight: '100%' },
};

export const swapTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: 'easeInOut' },
    style: { width: '100%', maxHeight: '100%' },
};
