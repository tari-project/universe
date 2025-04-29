import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Video, Wrapper, CTA } from './styles.ts';
import { BlocksMinimizeSVG } from '@app/containers/floating/Warmup/BlocksMinimizeSVG.tsx';

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
                        <BlocksMinimizeSVG />
                    </CTA>
                    <Video autoPlay loop src={src}></Video>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
