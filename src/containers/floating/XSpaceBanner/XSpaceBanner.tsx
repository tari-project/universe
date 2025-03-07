// import { X } from 'lucide-react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import {
    BannerContent,
    IconContainer,
    TextSection,
    LiveBadgePoint,
    ScheduleBadge,
    Title,
    LiveBadgeText,
    LiveBadgeWrapper,
    FloatingWrapper,
} from './XSpaceBanner.style';
import { useMemo } from 'react';

const XSpaceEventBanner = () => {
    // Truncate title if it's too long
    let latestXSpaceEvent = useAirdropStore((state) => state.latestXSpaceEvent);

    console.log({ latestXSpaceEvent });

    latestXSpaceEvent = {
        id: 'id',
        start: new Date(),
        end: new Date(),
        displayName: 'No new eventsdsfffffffffffffffffffffffffffffffffffffffffffffsdfsdf',
    };

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
        return latestXSpaceEvent.start
            .toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                hour12: true,
                timeZoneName: 'shortGeneric',
            })
            .replace(' at ', ' @ ')
            .toUpperCase();
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
    const displayDate = displayedDate ? <ScheduleBadge>{displayedDate}</ScheduleBadge> : null;

    const someIcon = 'hey';
    return (
        <FloatingWrapper>
            <BannerContent>
                <TextSection>
                    <IconContainer>{someIcon}</IconContainer>
                    <Title>{displayedText}</Title>
                </TextSection>
                {isLive ? liveBadge : displayDate}
            </BannerContent>
        </FloatingWrapper>
    );
};

export default XSpaceEventBanner;
