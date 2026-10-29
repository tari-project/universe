import { useEffect, useState, useRef, useCallback } from 'react';

import { toastVariants } from './motion';
import { removeToast, ToastType } from '../useToastStore';

import { Wrapper, CloseButton, ToastContent, ProgressCircle, Title, Text } from './styles';

const CIRCLE_CIRCUMFERENCE = 75.398;

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
    const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elapsedTimeRef = useRef<number>(0);
    const lastUpdateRef = useRef<number>(0);
    const circleRef = useRef<SVGCircleElement | null>(null);

    const clearTimers = useCallback(() => {
        if (dismissTimeoutRef.current !== null) {
            clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = null;
        }
        if (hideTimeoutRef.current !== null) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const handleHide = useCallback(
        (toastId: number | string = 0) => {
            clearTimers();
            setShow(false);
            removeToast(toastId);
        },
        [clearTimers]
    );

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
        if (!show) {
            return clearTimers;
        }

        const safeTimeout = Math.max(timeout, 1);
        const circle = circleRef.current;

        if (!isHovered) {
            const remaining = Math.max(0, safeTimeout - elapsedTimeRef.current);
            lastUpdateRef.current = Date.now();

            if (circle) {
                const startRatio = Math.min(Math.max(elapsedTimeRef.current / safeTimeout, 0), 1);
                circle.style.transition = 'none';
                circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * (1 - startRatio)}`;
                void circle.getBoundingClientRect();
                circle.style.transition = `stroke-dashoffset ${remaining}ms linear`;
                circle.style.strokeDashoffset = '0';
            }

            dismissTimeoutRef.current = setTimeout(() => {
                dismissTimeoutRef.current = null;
                elapsedTimeRef.current = safeTimeout;
                hideTimeoutRef.current = setTimeout(() => {
                    hideTimeoutRef.current = null;
                    handleHide(id);
                }, 200);
            }, remaining);
        } else {
            if (lastUpdateRef.current > 0) {
                elapsedTimeRef.current = Math.min(
                    safeTimeout,
                    elapsedTimeRef.current + Math.max(0, Date.now() - lastUpdateRef.current)
                );
            }
            clearTimers();
            if (circle) {
                const pausedRatio = Math.min(Math.max(elapsedTimeRef.current / safeTimeout, 0), 1);
                circle.style.transition = 'none';
                circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * (1 - pausedRatio)}`;
            }
        }

        return clearTimers;
    }, [show, isHovered, timeout, id, handleHide, clearTimers]);

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
                    <ProgressCircle width="28" height="28" viewBox="0 0 28 28" $type={type}>
                        <circle
                            ref={circleRef}
                            cx="14"
                            cy="14"
                            r="12"
                            strokeDasharray={String(CIRCLE_CIRCUMFERENCE)}
                            strokeDashoffset={CIRCLE_CIRCUMFERENCE}
                        />
                    </ProgressCircle>
                    <span>×</span>
                </CloseButton>
            </ToastContent>
        </Wrapper>
    );
};
