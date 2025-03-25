import Progress from './components/Progress.tsx';
import AirdropInvite from './actions/AirdropInvite.tsx';
import AirdropLogin from './actions/AirdropLogin.tsx';
import ModeSelection from './actions/ModeSelection.tsx';
import coins from '/assets/img/coins.png';

import {
    ActionContent,
    Content,
    FooterContent,
    HeaderContent,
    HeaderImg,
    Heading,
    SubHeading,
    Wrapper,
} from './sync.styles.ts';

export default function Sync() {
    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderImg src={coins} alt="coin ring img" />
                    <Heading>{'Connecting to the Tari network'}</Heading>
                    <SubHeading>{`Syncing the latest blocks to keep you up to date. \nThis might take a moment—while you wait, check out what you can do next.`}</SubHeading>
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
