import { useEffect, useState } from 'react';

import { toastVariants } from './motion';
import { ToastType, useToastStore } from '../useToastStore';

import { Wrapper } from './styles';

export interface Props {
    id?: number | string;
    index?: number;
    message: string;
    timeout?: number;
    isHovered?: boolean;
    type?: ToastType;
}

export const Toast = ({ id, index, message, timeout = 4500, isHovered = false, type = 'default' }: Props) => {
    const [show, setShow] = useState(false);
    const [positionVariant, setPositionVariant] = useState('hidden');
    const { removeToast } = useToastStore();

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
    }

    return (
        <Wrapper
            initial="initial"
            exit={`exit${positionVariant.charAt(0).toUpperCase() + positionVariant.slice(1)}`}
            variants={toastVariants}
            animate={positionVariant}
            onClick={() => handleHide(id)}
            $isFirst={index === 0}
            $type={type}
        >
            {message}
        </Wrapper>
    );
};
