import { useEffect, useState, useRef, useCallback } from 'react';

import { toastVariants } from './motion';
import { removeToast, ToastType } from '../useToastStore';

import { Wrapper, CloseButton, ToastContent, ProgressCircle, Title, Text } from './styles';
import { useMotionValue } from 'motion/react';

interface ToastProps {
    id?: number | string;
    index?: number;
    title: string;
    text?: string;
    timeout?: number;
    isHovered?: boolean;
    type?: ToastType;
}

export const Toast = ({ id, index, title, text, timeout = 4500, isHovered = false, type = 'default' }: ToastProps) => {
    const [show, setShow] = useState(false);
    const [positionVariant, setPositionVariant] = useState('hidden');
    const progress = useMotionValue(0);
    const progressInterval = useRef<NodeJS.Timeout>();
    const elapsedTimeRef = useRef<number>(0);
    const lastUpdateRef = useRef<number>(Date.now());
    const [finished, setFinished] = useState(false);

    const handleHide = useCallback((id: number | string = 0) => {
        setShow(false);
        removeToast(id);
    }, []);

    useEffect(() => {
        setShow(true);
    }, []);

    useEffect(() => {
        if (show) {
            if (index === 0) setPositionVariant('first');
            else if (index === 1) setPositionVariant('second');
            else if (index === 2) setPositionVariant('third');
        }
    }, [show, index]);

    useEffect(() => {
        if (show) {
            if (!isHovered) {
                lastUpdateRef.current = Date.now();
                const updateProgress = () => {
                    const now = Date.now();
                    elapsedTimeRef.current += now - lastUpdateRef.current;
                    lastUpdateRef.current = now;

                    const newProgress = (elapsedTimeRef.current / timeout) * 100;

                    if (newProgress <= 100) {
                        progress.set(newProgress);
                        progressInterval.current = setTimeout(updateProgress, 10);
                    } else if (!finished) {
                        setFinished(true);
                        setTimeout(() => handleHide(id), 200);
                    }
                };

                updateProgress();
            } else {
                // save the pause point
                const now = Date.now();
                elapsedTimeRef.current += now - lastUpdateRef.current;
                clearTimeout(progressInterval.current);
            }
        }

        return () => clearTimeout(progressInterval.current);
    }, [show, isHovered, timeout, id, handleHide, finished, progress]);

    return (
        <Wrapper
            initial="initial"
            exit={`exit${positionVariant.charAt(0).toUpperCase() + positionVariant.slice(1)}`}
            variants={toastVariants}
            animate={positionVariant}
            onClick={(e) => e.target === e.currentTarget && handleHide(id)}
            $isFirst={index === 0}
            $type={type}
        >
            <ToastContent>
                <Title>{title}</Title>
                {text && <Text>{text}</Text>}
                <CloseButton onClick={() => handleHide(id)} $type={type}>
                    <ProgressCircle width="28" height="28" viewBox="0 0 28 28" $progress={progress.get()} $type={type}>
                        <circle
                            cx="14"
                            cy="14"
                            r="12"
                            strokeDasharray="75.398"
                            strokeDashoffset={75.398 - (75.398 * Math.min(progress.get(), 100)) / 100}
                        />
                    </ProgressCircle>
                    <span>×</span>
                </CloseButton>
            </ToastContent>
        </Wrapper>
    );
};
