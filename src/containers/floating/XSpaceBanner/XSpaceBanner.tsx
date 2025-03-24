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
import { open } from '@tauri-apps/plugin-shell';
import { XSpaceEventType } from '@app/utils/XSpaceEventType';
import { useTranslation } from 'react-i18next';

const XSpaceEventBanner = () => {
    const latestXSpaceEvent = useAirdropStore((state) => state.latestXSpaceEvent);
    const [isTextTooLong, setIsTextTooLong] = useState(false);
    const [transitionPixelWidth, setTransitionPixelWidth] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation('common', { useSuspense: false });

    useEffect(() => {
        if (!latestXSpaceEvent) return;

        const checkVisibility = () => {
            const now = new Date();
            const start = new Date(latestXSpaceEvent.visibilityStart);
            setIsVisible(now >= start);

            if (!latestXSpaceEvent.goingLive || latestXSpaceEvent.type !== XSpaceEventType.event) return;
            const currentDate = new Date();
            setIsLive(
                new Date(latestXSpaceEvent.visibilityEnd) >= currentDate &&
                    new Date(latestXSpaceEvent.goingLive) <= currentDate
            );
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 15000); // check every 15 sec
        return () => clearInterval(interval);
    }, [latestXSpaceEvent]);

    useEffect(() => {
        if (titleRef.current && containerRef.current) {
            const titleWidth = titleRef.current.scrollWidth;
            const containerWidth = containerRef.current.clientWidth;
            setIsTextTooLong(titleWidth > containerWidth);
            setTransitionPixelWidth(titleWidth / 2);
        }
    }, [latestXSpaceEvent]); // Re-run the effect when the event changes

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
            <LiveBadgeText>{t('live').toUpperCase()}</LiveBadgeText>
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
                        {`${latestXSpaceEvent.text} ${isTextTooLong ? latestXSpaceEvent.text : ''}`}
                    </Title>
                </TitleContainer>
                {isLive ? liveBadge : displayDate}
            </FlexWrapper>
        </BannerContent>
    );
};

export default XSpaceEventBanner;
