import { IoClose } from 'react-icons/io5';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Video, Wrapper, CTA } from './styles.ts';

interface VideoModalProps {
    src: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    firstPlay?: boolean;
}

export function VideoModal({ src, open, onOpenChange, firstPlay = false }: VideoModalProps) {
    function handleEnded() {
        if (open && firstPlay) {
            onOpenChange(false);
            return;
        }
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent $unPadded>
                <Wrapper>
                    <CTA onClick={() => onOpenChange(false)}>
                        <IoClose />
                    </CTA>
                    <Video autoPlay={open} controls playsInline preload="auto" loop={false} onEnded={handleEnded}>
                        <source src={src} />
                    </Video>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
