import { useEffect, useState } from 'react';

import { toastVariants } from './motion';
import { useToastStore } from './useToastStore';

import { ToastWrapper, ToastInside, ToastText } from './styles';

export interface ToastProps {
    id?: number | string;
    index?: number;
    emoji?: string;
    message: string;
    timeout?: number;
    delay?: number;
    isHovered?: boolean;
    minimal?: boolean;
    isLoader?: boolean;
    messageAction?: {
        copy: string;
        onAction: () => void;
    };
    onAction?: (id: number | string) => void;
}

export const Toast = ({
    id,
    index,
    message,
    timeout = 4500,
    isHovered = false,
    messageAction,
    onAction,
}: ToastProps) => {
    const [show, setShow] = useState(false);
    const { removeToast } = useToastStore();

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (show && !isHovered) {
            timer = setTimeout(() => {
                setShow(false);
                removeToast(id || 0);
            }, timeout);
        }

        return () => clearTimeout(timer);
    }, [show, id, timeout, removeToast, isHovered]);

    function handleHide(id: number | string = 0) {
        setShow(false);
        removeToast(id);
        onAction?.(id);
    }

    let positionVariant = 'hidden';

    if (show) {
        if (index === 0) positionVariant = 'first';
        else if (index === 1) positionVariant = 'second';
        else if (index === 2) positionVariant = 'third';
    }

    return (
        <ToastWrapper
            initial="initial"
            exit="exit"
            variants={toastVariants}
            animate={positionVariant}
            onClick={() => handleHide(id)}
        >
            <ToastInside>
                <ToastText>
                    {message}{' '}
                    {messageAction ? (
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                messageAction.onAction();
                            }}
                        >
                            {' '}
                            {messageAction.copy}{' '}
                        </span>
                    ) : null}
                </ToastText>
            </ToastInside>
        </ToastWrapper>
    );
};
