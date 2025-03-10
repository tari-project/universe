// import { X } from 'lucide-react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import {
    BannerContent,
    IconContainer,
    TextSection,
    LiveBadgePoint,
    TimeBadge,
    Title,
    LiveBadgeText,
    LiveBadgeWrapper,
} from './XSpaceBanner.style';
import { useMemo } from 'react';
import XSpaceSvg from '@app/components/svgs/XSpaceSvg';

const XSpaceEventBanner = () => {
    // Truncate title if it's too long
    const latestXSpaceEvent = useAirdropStore((state) => state.latestXSpaceEvent);

    const isLive = useMemo(() => {
        const currentDate = new Date();
        if (latestXSpaceEvent) {
            return latestXSpaceEvent.end >= currentDate && latestXSpaceEvent.start <= currentDate;
        }
        return false;
    }, [latestXSpaceEvent]);

    const displayedText = useMemo(() => {
        if (!latestXSpaceEvent) {
            return '';
        }
        const displayTitle =
            latestXSpaceEvent.displayName.length > 40
                ? `${latestXSpaceEvent.displayName.substring(0, 37)}...`
                : latestXSpaceEvent.displayName;
        return displayTitle;
    }, [latestXSpaceEvent]);

    const displayedDate = useMemo(() => {
        if (!latestXSpaceEvent || isLive) {
            return '';
        }
        const dateFormatted = new Date(latestXSpaceEvent.start)
            .toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                hour12: true,
                timeZoneName: 'short',
            })
            .replace(', ', ' @')
            .toUpperCase();
        return dateFormatted;
    }, [latestXSpaceEvent, isLive]);

    if (!latestXSpaceEvent) {
        return undefined;
    }

    const liveBadge = (
        <LiveBadgeWrapper>
            <LiveBadgePoint />
            <LiveBadgeText>LIVE</LiveBadgeText>
        </LiveBadgeWrapper>
    );
    const displayDate = displayedDate ? <TimeBadge>{displayedDate}</TimeBadge> : null;

    return (
        <BannerContent>
            <TextSection>
                <IconContainer>
                    <XSpaceSvg></XSpaceSvg>
                </IconContainer>
                <Title>{displayedText}</Title>
            </TextSection>
            {isLive ? liveBadge : displayDate}
        </BannerContent>
    );
};

export default XSpaceEventBanner;
