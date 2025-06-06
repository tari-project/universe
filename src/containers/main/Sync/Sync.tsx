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

export default function Sync() {
    const { t } = useTranslation('setup-view');
    const theme = useTheme();

    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderGraphic>
                        {theme.mode === 'light' ? (
                            <VideoStream
                                src="https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/d15edd1d0a5a2452a49f1312312b69f0/manifest/video.m3u8"
                                poster={coin_light}
                            />
                        ) : (
                            <VideoStream
                                src="https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/af0c72594da95f7507ccca86831c4c0b/manifest/video.m3u8"
                                poster={coin_dark}
                            />
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
