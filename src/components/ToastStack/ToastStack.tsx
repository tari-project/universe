import { memo, useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useToastStore } from './useToastStore';
import { Toast } from './Toast/Toast';
import { Inside, Wrapper } from './styles';

const ToastStack = memo(function ToastStack() {
    const { toasts } = useToastStore();
    const isSettingUp = useSetupStore((s) => !s.setupComplete);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    const reversedToasts = [...toasts].reverse();

    return (
        <>
            <Wrapper $isSettingUp={isSettingUp}>
                <Inside onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <AnimatePresence>
                        {reversedToasts.map(({ id, title, text, timeout, type }, index) => (
                            <Toast
                                key={`toast-${id}-${title}`}
                                id={id || 0}
                                title={title}
                                text={text}
                                timeout={timeout}
                                type={type}
                                index={index}
                                isHovered={isHovered}
                            />
                        ))}
                    </AnimatePresence>
                </Inside>
            </Wrapper>
        </>
    );
});

export default ToastStack;
