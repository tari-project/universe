import Progress from './components/Progress.tsx';
import AirdropInvite from './actions/AirdropInvite.tsx';
import AirdropLogin from './actions/AirdropLogin.tsx';
import ModeSelection from './actions/ModeSelection.tsx';

import {
    ActionContent,
    Content,
    FooterContent,
    HeaderContent,
    HeaderGraphic,
    Heading,
    SubHeading,
    Wrapper,
} from './sync.styles.ts';
import { useTranslation } from 'react-i18next';
import VideoStream from '@app/components/VideoStream/VideoStream.tsx';
import { useTheme } from 'styled-components';
import { easeInOut } from 'motion';

import coin_dark from './images/coin_dark.png';
import coin_light from './images/coin_light.png';
import { URL_SYNC, URL_SYNC_DARK } from '@app/App/AppWrapper.tsx';

const containerVariants = {
    initial: {},
    animate: {
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeInOut } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3, ease: easeInOut } },
};

export default function Sync() {
    const { t } = useTranslation('setup-view');
    const theme = useTheme();

    return (
        <Wrapper>
            <Content variants={containerVariants} initial="initial" animate="animate" exit="exit">
                <HeaderContent variants={childVariants}>
                    <HeaderGraphic>
                        {theme.mode === 'light' ? (
                            <VideoStream src={URL_SYNC} poster={coin_light} />
                        ) : (
                            <VideoStream src={URL_SYNC_DARK} poster={coin_dark} />
                        )}
                    </HeaderGraphic>
                    <Heading variants={childVariants}>{t('sync.header')}</Heading>
                    <SubHeading variants={childVariants}>{t('sync.subheader')}</SubHeading>
                </HeaderContent>
                <ActionContent variants={childVariants}>
                    <AirdropLogin />
                    <ModeSelection />
                    <AirdropInvite />
                </ActionContent>
                <FooterContent variants={childVariants}>
                    <Progress />
                </FooterContent>
            </Content>
        </Wrapper>
    );
}
