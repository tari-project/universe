import { ReactNode } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import CloseIcon from './icons/CloseIcon';

import { BoxWrapper, TopButton, Title, TopWrapper } from './styles';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

interface Props {
    show: boolean;
    handleClose?: () => void;
    handleBack?: () => void;
    children: ReactNode;
    title?: string;
    noClose?: boolean;
    noHeader?: boolean;
}

export default function TransactionModal({ show, title, children, handleBack, handleClose, noClose, noHeader }: Props) {
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
        <Dialog open={show} onOpenChange={handleClose} disableClose={noClose}>
            <DialogContent variant="transparent">
                <BoxWrapper>
                    {noHeader ? null : (
                        <TopWrapper>
                            {title ? <Title>{title}</Title> : <div />}
                            {backIcon}
                            {closeIcon}
                        </TopWrapper>
                    )}

                    {children}
                </BoxWrapper>
            </DialogContent>
        </Dialog>
    );
}
