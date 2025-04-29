import { FaPlay } from 'react-icons/fa6';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { DashboardBanner, FlexSection, TagLine, VideoPreview } from './styles.ts';
import { setDialogToShow } from '@app/store';
import { VideoModal } from '@app/components/VideoModal/VideoModal.tsx';
import { useState } from 'react';

const VIDEO_SRC = 'https://static.tari.com/Tari-Announcement-BG.mp4';

export default function Banner() {
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
                        <div>{`TARI`}</div>
                        <div>{`MAINNET`}</div>
                        <span>{`IS LIVE`}</span>
                    </TagLine>
                </FlexSection>
                <FlexSection>
                    <Button onClick={handleClick} variant="primary" color="primary">{`Learn more`}</Button>
                </FlexSection>
            </DashboardBanner>
            <VideoModal open={expandPlayer} onOpenChange={handleVideoClick} src={VIDEO_SRC} />
        </>
    );
}
