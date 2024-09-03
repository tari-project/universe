import { IoClose } from 'react-icons/io5';
import useAppStateStore from '../../store/appStateStore';
import { ButtonWrapper, ContentWrapper, Wrapper } from './ErrorSnackbar.styles.ts';
import { AnimatePresence, easeIn, Variants } from 'framer-motion';
import { IconButton } from '@app/components/elements/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useClickOutside } from '@app/hooks/helpers/useClickOutside.ts';
import { useCallback, useEffect, useState } from 'react';

const transition = {
    duration: 0.3,
    ease: easeIn,
};
const variants: Variants = {
    hidden: {
        y: 200,
        opacity: 0,
        ...transition,
    },
    visible: {
        y: 0,
        opacity: 1,
        ...transition,
    },
};

const AUTO_CLOSE_TIMEOUT = 5000;
export default function ErrorSnackbar() {
    const [show, setShow] = useState(false);
    const error = useAppStateStore((s) => s.error);
    const setError = useAppStateStore((s) => s.setError);

    const handleClose = useCallback(() => {
        setError(undefined);
    }, [setError]);

    useEffect(() => {
        setShow(Boolean(error && error?.length));
    }, [error]);
    const clickRef = useClickOutside(handleClose, show);

    useEffect(() => {
        if (show) {
            const closeTimeout = setTimeout(() => {
                handleClose();
            }, AUTO_CLOSE_TIMEOUT);

            return () => {
                clearTimeout(closeTimeout);
            };
        }
    }, [handleClose, show]);

    return (
        <AnimatePresence>
            {show && (
                <Wrapper variants={variants} initial="hidden" animate="visible" exit="hidden" ref={clickRef}>
                    <ButtonWrapper>
                        <IconButton aria-label="close" onClick={handleClose}>
                            <IoClose />
                        </IconButton>
                    </ButtonWrapper>
                    <ContentWrapper>
                        <Typography>{error}</Typography>
                    </ContentWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
