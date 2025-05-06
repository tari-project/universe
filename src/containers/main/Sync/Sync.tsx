import Progress from './components/Progress.tsx';
import AirdropInvite from './actions/AirdropInvite.tsx';
import AirdropLogin from './actions/AirdropLogin.tsx';
import ModeSelection from './actions/ModeSelection.tsx';
import { type } from '@tauri-apps/plugin-os';
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
import { useMemo } from 'react';

export default function Sync() {
    const { t } = useTranslation('setup-view');
    const isMac = type() === 'macos';
    const videoMarkup = useMemo(
        () => (
            <video playsInline autoPlay loop muted controls={false}>
                <source src={`/assets/video/coinLoader.${isMac ? 'mov' : 'webm'}`} />
            </video>
        ),
        [isMac]
    );
    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderGraphic>{videoMarkup}</HeaderGraphic>
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
