import { AnimatePresence } from 'motion/react';
import CloseIcon from './icons/CloseIcon';
import { BoxWrapper, CloseButton, Cover, Title, TopWrapper, Wrapper } from './styles';

interface Props {
    show: boolean;
    handleClose: () => void;
    children: React.ReactNode;
    title?: string;
    noClose?: boolean;
}

export default function TransactionModal({ show, title, children, handleClose, noClose }: Props) {
    return (
        <AnimatePresence>
            {show && (
                <Wrapper>
                    <BoxWrapper
                        initial={{ opacity: 0, y: '100px' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        {Boolean(title) && (
                            <TopWrapper>
                                <Title>{title}</Title>
                                <CloseButton onClick={handleClose}>
                                    <CloseIcon />
                                </CloseButton>
                            </TopWrapper>
                        )}

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
