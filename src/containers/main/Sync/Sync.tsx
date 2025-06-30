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

import coin_dark from './images/coin_dark.png';
import coin_light from './images/coin_light.png';
import { URL_SYNC, URL_SYNC_DARK } from '@app/App/AppWrapper.tsx';

export default function Sync() {
    const { t } = useTranslation('setup-view');
    const theme = useTheme();

    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderGraphic>
                        {theme.mode === 'light' ? (
                            <VideoStream src={URL_SYNC} poster={coin_light} />
                        ) : (
                            <VideoStream src={URL_SYNC_DARK} poster={coin_dark} />
                        )}
                    </HeaderGraphic>
                    <Heading>{t('sync.header')}</Heading>
                    <SubHeading>{t('sync.subheader')}</SubHeading>
                </HeaderContent>
                <ActionContent>
                    <AirdropLogin />
                    <ModeSelection />
                    <AirdropInvite />
                </ActionContent>
                <FooterContent>
                    <Progress />
                </FooterContent>
            </Content>
        </Wrapper>
    );
}
