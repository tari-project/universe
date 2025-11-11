import { BoxWrapper, CloseButton } from './styles';

import CloseIcon from './icons/CloseIcon';
import { ReactNode } from 'react';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

interface GreenModalProps {
    onClose: () => void;
    children: ReactNode;
    padding?: number;
    showModal: boolean;
}

export default function GreenModal({ children, showModal, padding, onClose }: GreenModalProps) {
    return (
        <Dialog open={showModal} onOpenChange={onClose}>
            <DialogContent variant="wrapper">
                <BoxWrapper
                    $padding={padding}
                    initial={{ opacity: 0, y: '100px' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <CloseButton onClick={onClose}>
                        <CloseIcon />
                    </CloseButton>

                    {children}
                </BoxWrapper>
            </DialogContent>
        </Dialog>
    );
}
