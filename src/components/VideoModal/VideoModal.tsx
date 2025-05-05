import { IoClose } from 'react-icons/io5';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Video, Wrapper, CTA } from './styles.ts';

interface VideoModalProps {
    src: string;
    open: boolean;
    onOpenChange: () => void;
}

export function VideoModal({ src, open, onOpenChange }: VideoModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent $unPadded>
                <Wrapper>
                    <CTA onClick={onOpenChange}>
                        <IoClose />
                    </CTA>
                    <Video autoPlay src={src} controls playsInline></Video>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
