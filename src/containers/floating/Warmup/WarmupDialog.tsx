import { setDialogToShow, useUIStore } from '@app/store';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import {
    ContentWrapper,
    CTACopy,
    GraphicWrapper,
    HeaderTextWrapper,
    HeaderWrapper,
    Heading,
    TagLine,
    Wrapper,
} from './styles.ts';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { useTranslation } from 'react-i18next';
import track from '/assets/img/track.gif';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BlocksSVG } from './BlocksSVG.tsx';

const WarmupDialog = function WarmupDialogs() {
    const { t } = useTranslation('components');
    const open = useUIStore((s) => s.dialogToShow === 'warmup');
    function handleClose() {
        setDialogToShow(null);
    }
    const bodyCopy = t('warmupDialog.copy');
    const paragrpahs = bodyCopy.split('\n');

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <HeaderWrapper>
                        <BlocksSVG />
                        <GraphicWrapper>
                            <img src={track} alt="zzzoooom" />
                        </GraphicWrapper>
                        <HeaderTextWrapper>
                            <TagLine>{t('warmupDialog.tag-line')}</TagLine>
                            <GradientText>
                                <Heading>{t('warmupDialog.title')}</Heading>
                            </GradientText>
                        </HeaderTextWrapper>
                    </HeaderWrapper>
                    <ContentWrapper>
                        <Typography variant="h5">{t('warmupDialog.subtitle')}</Typography>
                        {paragrpahs.map((p) => (
                            <Typography key={p.slice(0, 10)}>{p}</Typography>
                        ))}
                    </ContentWrapper>
                    <Button type="submit" fluid size="xlarge" variant="yellow" onClick={handleClose}>
                        <CTACopy>{t('releaseNotesDialog.close')}</CTACopy>
                    </Button>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
};

export default WarmupDialog;
