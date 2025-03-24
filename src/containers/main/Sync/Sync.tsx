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
import coins from '/assets/img/coins.png';
import Progress from './components/Progress.tsx';
import { SyncActionCard } from './components/SyncActionCard.tsx';

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
                    <SyncActionCard title={`Earn Gems`} />
                    <SyncActionCard title={`Customize Mode`} />
                    <SyncActionCard title={`Invite Friends`} />
                </ActionContent>

                <FooterContent>
                    <Progress />
                </FooterContent>
            </Content>
        </Wrapper>
    );
}
