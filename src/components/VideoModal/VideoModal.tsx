import { IoClose } from 'react-icons/io5';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Video, Wrapper, CTA } from './styles.ts';

interface VideoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    firstPlay?: boolean;
}
const VIDEO_SRC = 'https://static.tari.com/Tari-Announcement-BG.mp4';
export function VideoModal({ open, onOpenChange, firstPlay = false }: VideoModalProps) {
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
                    <Video autoPlay controls playsInline onEnded={() => handleEnded()}>
                        <source src={VIDEO_SRC} type="video/mp4" />
                    </Video>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
