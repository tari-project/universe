// import { X } from 'lucide-react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import {
    BannerContent,
    IconContainer,
    FlexWrapper,
    LiveBadgePoint,
    TimeBadge,
    Title,
    LiveBadgeText,
    LiveBadgeWrapper,
    TitleContainer,
} from './XSpaceBanner.style';
import { useEffect, useMemo, useRef, useState } from 'react';
import XSpaceSvg from '@app/components/svgs/XSpaceSvg';

const XSpaceEventBanner = () => {
    const latestXSpaceEvent = useAirdropStore((state) => state.latestXSpaceEvent);
    const [isTextTooLong, setIsTextTooLong] = useState(false);
    const [transitionPixelWidth, setTransitionPixelWidth] = useState(0);
    const titleRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (titleRef.current && containerRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const titleWidth = (titleRef.current as any).scrollWidth;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const containerWidth = (containerRef.current as any).clientWidth;
            setIsTextTooLong(titleWidth > containerWidth);
            setTransitionPixelWidth((titleRef.current as any).scrollWidth / 2);
        }
    }, [latestXSpaceEvent]); // Re-run the effect when the event changes

    const isLive = useMemo(() => {
        const currentDate = new Date();
        if (latestXSpaceEvent) {
            return new Date(latestXSpaceEvent.end) >= currentDate && new Date(latestXSpaceEvent.start) <= currentDate;
        }
        return false;
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
            <FlexWrapper>
                <IconContainer>
                    <XSpaceSvg></XSpaceSvg>
                </IconContainer>
                <TitleContainer ref={containerRef}>
                    <Title
                        ref={titleRef}
                        animate={
                            isTextTooLong
                                ? {
                                      x: ['0px', `-${transitionPixelWidth}px`],
                                  }
                                : { x: '0%' }
                        }
                        transition={
                            isTextTooLong
                                ? {
                                      repeat: Infinity,
                                      repeatType: 'loop',
                                      duration: 5,
                                      delay: 2,
                                      ease: 'linear',
                                  }
                                : {}
                        }
                    >
                        {`${latestXSpaceEvent.displayName} ${isTextTooLong ? latestXSpaceEvent.displayName : ''}`}
                    </Title>
                </TitleContainer>
                {isLive ? liveBadge : displayDate}
            </FlexWrapper>
        </BannerContent>
    );
};

export default XSpaceEventBanner;
