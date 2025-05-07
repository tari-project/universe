import { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { IoArrowBack } from 'react-icons/io5';
import CloseIcon from './icons/CloseIcon';

import { BoxWrapper, TopButton, Cover, Title, TopWrapper, Wrapper } from './styles';

interface Props {
    show: boolean;
    handleClose?: () => void;
    handleBack?: () => void;
    children: ReactNode;
    title?: string;
    noClose?: boolean;
}

export default function TransactionModal({ show, title, children, handleBack, handleClose, noClose }: Props) {
    const backIcon = handleBack ? (
        <TopButton onClick={handleBack}>
            <IoArrowBack />
        </TopButton>
    ) : null;

    const closeIcon = handleClose ? (
        <TopButton onClick={handleClose}>
            <CloseIcon />
        </TopButton>
    ) : null;
    return (
        <AnimatePresence>
            {show && (
                <Wrapper>
                    <BoxWrapper
                        initial={{ opacity: 0, y: '100px' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <TopWrapper>
                            {title ? <Title>{title}</Title> : <div />}
                            {backIcon}
                            {closeIcon}
                        </TopWrapper>

                        {children}
                    </BoxWrapper>

                    <Cover
                        onClick={!noClose ? handleClose : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        $noClose={noClose}
                    />
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
