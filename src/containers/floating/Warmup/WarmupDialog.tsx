import { memo } from 'react';
import { setDialogToShow, useUIStore } from '@app/store';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { GraphicWrapper, HeaderWrapper, Heading, Wrapper } from './styles.ts';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { useTranslation } from 'react-i18next';
import track from '/assets/img/track.gif';

const WarmupDialog = memo(function WarmupDialogs() {
    const { t } = useTranslation('components');
    const open = useUIStore((s) => s.dialogToShow === 'warmup');
    function handleClose() {
        setDialogToShow(null);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <HeaderWrapper>
                        <GraphicWrapper>
                            <img src={track} alt="zzzoooom" />
                        </GraphicWrapper>
                        <GradientText>
                            <Heading variant="h1">{t('title')}</Heading>
                        </GradientText>
                    </HeaderWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default WarmupDialog;
