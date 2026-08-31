import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { open } from '@tauri-apps/plugin-shell';
import { useTranslation } from 'react-i18next';
import NewsletterSvg from '@app/components/svgs/NewsletterSvg';
import { useAirdropStore, useUIStore } from '@app/store';
import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { useLatestUpdateStore } from '@app/store/useLatestUpdateStore';
import {
    BannerContent,
    ContentContainer,
    FlexWrapper,
    IconContainer,
    Label,
    Title,
    TitleContainer,
} from './NewsletterBanner.style';

const NewsletterBanner = () => {
    const latestUpdate = useLatestUpdateStore((state) => state.latestUpdate);
    const showTapplet = useUIStore((state) => state.showTapplet);
    const [isTextTooLong, setIsTextTooLong] = useState(false);
    const [transitionPixelWidth, setTransitionPixelWidth] = useState(0);
    const titleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation('common', { useSuspense: false });

    const isLoggedIn = useAirdropStore((state) => !!state.airdropTokens);
    const crewRewardsActive = useCrewRewardsStore((state) => state.showWidget);
    const crewRewardsMinimized = useCrewRewardsStore((state) => state.isMinimized);

    useEffect(() => {
        const isTextTooLong = (latestUpdate?.title.length || 0) > 25;
        setIsTextTooLong(isTextTooLong);
        if (isTextTooLong && titleRef.current && containerRef.current) {
            const titleWidth = titleRef.current.scrollWidth || 0;
            setTransitionPixelWidth(titleWidth / 2);
        }
    }, [latestUpdate]);

    return (
        <AnimatePresence>
            {latestUpdate && !showTapplet && (
                <BannerContent
                    onClick={() => {
                        open(latestUpdate.url);
                    }}
                    $crewRewardsActive={crewRewardsActive && !showTapplet}
                    $crewRewardsMinimized={crewRewardsMinimized && crewRewardsActive && !showTapplet}
                    $isLoggedIn={isLoggedIn}
                >
                    <FlexWrapper>
                        <IconContainer>
                            <NewsletterSvg />
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
                            <Label
                                key="label"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {t('new_update').toUpperCase()}
                            </Label>

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
                                    {`${latestUpdate.title} ${isTextTooLong ? latestUpdate.title : ''}`}
                                </Title>
                            </TitleContainer>
                        </ContentContainer>
                    </FlexWrapper>
                </BannerContent>
            )}
        </AnimatePresence>
    );
};

export default NewsletterBanner;
