import { useAirdropStore } from '@app/store/useAirdropStore';
import {
    BannerContent,
    ContentContainer,
    DateLabel,
    FlexWrapper,
    IconContainer,
    JoinSpaceWrapper,
    LiveBadgeText,
    LiveBadgeWrapper,
    LiveWrapper,
    Title,
    TitleContainer,
} from './XSpaceBanner.style';
import { useEffect, useMemo, useRef, useState } from 'react';
import XSpaceSvg from '@app/components/svgs/XSpaceSvg';
import { open } from '@tauri-apps/plugin-shell';
import { XSpaceEventType } from '@app/utils/XSpaceEventType';
import { useTranslation } from 'react-i18next';
import { formatDateForEvent } from './formatDate';
import { AnimatePresence } from 'motion/react';

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
            const visibilityDate = new Date(latestXSpaceEvent.visibilityEnd);
            const goLiveDate = new Date(latestXSpaceEvent.goingLive);
            setIsLive(visibilityDate >= currentDate && goLiveDate <= currentDate);
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 15000); // check every 15 sec
        return () => clearInterval(interval);
    }, [latestXSpaceEvent]);

    useEffect(() => {
        const isTextTooLong = (latestXSpaceEvent?.text.length || 0) > 25;
        setIsTextTooLong(isTextTooLong);
        if (isTextTooLong && titleRef.current && containerRef.current) {
            const titleWidth = titleRef.current.scrollWidth || 0;
            setTransitionPixelWidth(titleWidth / 2);
        }
    }, [latestXSpaceEvent]); // Re-run the effect when the event changes

    const displayedDate = useMemo(() => {
        try {
            return latestXSpaceEvent?.goingLive ? formatDateForEvent(new Date(latestXSpaceEvent.goingLive)) : null;
        } catch (error) {
            console.error('Invalid date format for event:', error);
            return null;
        }
    }, [latestXSpaceEvent]);

    return (
        <AnimatePresence>
            {latestXSpaceEvent && isVisible && (
                <BannerContent
                    onClick={() => {
                        open(latestXSpaceEvent.link);
                    }}
                >
                    <FlexWrapper>
                        <IconContainer>
                            <XSpaceSvg></XSpaceSvg>
                        </IconContainer>
                        <ContentContainer
                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                            animate={{ width: 'auto', marginLeft: 12, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.5,
                            }}
                        >
                            {isLive ? (
                                <LiveWrapper
                                    key="live"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <LiveBadgeWrapper>
                                        <LiveBadgeText>{t('live').toUpperCase()}</LiveBadgeText>
                                    </LiveBadgeWrapper>
                                    <JoinSpaceWrapper>{t('join_the_space')}</JoinSpaceWrapper>
                                </LiveWrapper>
                            ) : (
                                <DateLabel
                                    key="date"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {displayedDate ? displayedDate : t('coming_soon').toUpperCase()}
                                </DateLabel>
                            )}

                            <TitleContainer ref={containerRef} $hasTextOverflow={isTextTooLong}>
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
                                                  delay: 1,
                                                  ease: 'linear',
                                              }
                                            : {}
                                    }
                                >
                                    {`${latestXSpaceEvent.text} ${isTextTooLong ? latestXSpaceEvent.text : ''}`}
                                </Title>
                            </TitleContainer>
                        </ContentContainer>
                    </FlexWrapper>
                </BannerContent>
            )}
        </AnimatePresence>
    );
};

export default XSpaceEventBanner;
