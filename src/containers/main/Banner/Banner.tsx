import { FaPlay } from 'react-icons/fa6';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { BodyCopy, DashboardBanner, FlexSection, TagLine, VideoPreview } from './styles.ts';
import { setDialogToShow } from '@app/store';
import { VideoModal } from '@app/components/VideoModal/VideoModal.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';

const VIDEO_SRC = 'https://static.tari.com/Tari-Announcement-BG.mp4';

export default function Banner() {
    const { t } = useTranslation(['common', 'components']);
    const [expandPlayer, setExpandPlayer] = useState(false);
    function handleClick() {
        setDialogToShow('warmup');
    }
    function handleVideoClick() {
        setExpandPlayer((c) => !c);
    }
    return (
        <>
            <DashboardBanner>
                <FlexSection>
                    <VideoPreview onClick={handleVideoClick}>
                        <FaPlay />
                        <video src={VIDEO_SRC} />
                    </VideoPreview>
                    <TagLine>
                        <div>{t('tari')}</div>
                        <div>{t('mainnet')}</div>
                        <span>{t('components:banner.is-live')}</span>
                    </TagLine>
                </FlexSection>
                <FlexSection>
                    <BodyCopy>
                        <Typography variant="h6">
                            <strong>{t('components:banner.body-copy', { context: 'highlight' })}</strong>&nbsp;
                        </Typography>
                        <Typography variant="h6">{t('components:banner.body-copy')}</Typography>
                    </BodyCopy>
                    <Button onClick={handleClick} variant="primary" color="primary">
                        {t('learn-more')}
                    </Button>
                </FlexSection>
            </DashboardBanner>
            <VideoModal open={expandPlayer} onOpenChange={handleVideoClick} src={VIDEO_SRC} />
        </>
    );
}
