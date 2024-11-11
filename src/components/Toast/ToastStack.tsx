import { useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import { Toast } from './Toast';
import { useToastStore } from './useToastStore';

import { ToastsPadding, ToastsWrapper } from './styles';

export const ToastStack = () => {
    const { toasts } = useToastStore();
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const reversedToasts = [...toasts].reverse();

    return (
        <ToastsWrapper>
            <ToastsPadding onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <AnimatePresence>
                    {reversedToasts.map(({ id, ...toastProps }, index) => (
                        <Toast
                            {...toastProps}
                            key={`toast-${id}-${toastProps.message}`}
                            id={id || 0}
                            index={index}
                            isHovered={isHovered}
                        />
                    ))}
                </AnimatePresence>
            </ToastsPadding>
        </ToastsWrapper>
    );
};
