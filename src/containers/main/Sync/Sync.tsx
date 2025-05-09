import { type } from '@tauri-apps/plugin-os';
import { useTranslation } from 'react-i18next';

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

import mov from '@app/assets/video/coinLoader.mov?url';
import webm from '@app/assets/video/coinLoader.webm?url';
const isMac = type() === 'macos';

export default function Sync() {
    const { t } = useTranslation('setup-view');

    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderGraphic>
                        <video playsInline autoPlay loop muted controls={false} key={isMac ? 'mov' : 'webm'}>
                            {isMac ? (
                                <source src={mov} type="video/quicktime" />
                            ) : (
                                <source src={webm} type="video/webm" />
                            )}
                        </video>
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
