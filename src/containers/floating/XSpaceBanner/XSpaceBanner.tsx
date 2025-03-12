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
import { XSpaceEventType } from '@app/types/ws';
import { open } from '@tauri-apps/plugin-shell';

const XSpaceEventBanner = () => {
    const latestXSpaceEvent = useAirdropStore((state) => state.latestXSpaceEvent);
    const [isTextTooLong, setIsTextTooLong] = useState(false);
    const [transitionPixelWidth, setTransitionPixelWidth] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const titleRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!latestXSpaceEvent) return;

        const checkVisibility = () => {
            const now = new Date();
            const start = new Date(latestXSpaceEvent.visibilityStart);
            setIsVisible(now >= start);
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 30000); // check every 30 sec
        return () => clearInterval(interval);
    }, [latestXSpaceEvent]);

    useEffect(() => {
        if (titleRef.current && containerRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const titleWidth = (titleRef.current as any).scrollWidth;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const containerWidth = (containerRef.current as any).clientWidth;
            setIsTextTooLong(titleWidth > containerWidth);
            setTransitionPixelWidth((titleRef.current as any).scrollWidth / 3);
        }
    }, [latestXSpaceEvent]); // Re-run the effect when the event changes

    const isLive = useMemo(() => {
        const currentDate = new Date();
        if (latestXSpaceEvent) {
            if (!latestXSpaceEvent.goingLive || latestXSpaceEvent.type !== XSpaceEventType.event) return false;
            return (
                new Date(latestXSpaceEvent.visibilityEnd) >= currentDate &&
                new Date(latestXSpaceEvent.goingLive) <= currentDate
            );
        }
        return false;
    }, [latestXSpaceEvent]);

    const displayedDate = useMemo(() => {
        if (!latestXSpaceEvent || isLive || !latestXSpaceEvent.goingLive) {
            return undefined;
        }
        const dateFormatted = new Date(latestXSpaceEvent.goingLive)
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

    if (!latestXSpaceEvent || !isVisible) {
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
        <BannerContent
            onClick={() => {
                open(latestXSpaceEvent.link);
            }}
        >
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
                                      duration: 10,
                                      delay: 2,
                                      ease: 'linear',
                                  }
                                : {}
                        }
                    >
                        {`${latestXSpaceEvent.text} ${isTextTooLong ? latestXSpaceEvent.text : ''} ${isTextTooLong ? latestXSpaceEvent.text : ''}`}
                    </Title>
                </TitleContainer>
                {isLive ? liveBadge : displayDate}
            </FlexWrapper>
        </BannerContent>
    );
};

export default XSpaceEventBanner;
