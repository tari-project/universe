import { type CrewEntry } from '../../data';
import { ContentWrapper, Wrapper, TopRow, Username } from './styles';
import CrewAvatar from './CrewAvatar/CrewAvatar';

import CrewProgressBar from './CrewProgressBar/CrewProgressBar';
import CrewProgressPill from './CrewProgressPill/CrewProgressPill';

interface Props {
    entry: CrewEntry;
    isClaimed?: boolean;
}

export default function CrewEntry({ entry, isClaimed }: Props) {
    const { handle, reward, progress, timeRemaining, status, user } = entry;

    const canClaim = status === 'completed';
    const canNudge = status === 'needs_nudge';

    const handleClaim = () => {
        //console.log('claim');
    };

    const handleNudge = () => {
        //console.log('nudge');
    };

    return (
        <Wrapper $canClaim={canClaim ?? false} $isClaimed={isClaimed ?? false}>
            <CrewAvatar image={user.avatar} isOnline={user.isOnline} />
            <ContentWrapper>
                <TopRow>
                    <Username>{handle}</Username>
                    <CrewProgressPill
                        canClaim={canClaim ?? false}
                        canNudge={canNudge ?? false}
                        isClaimed={isClaimed ?? false}
                        timeRemaining={timeRemaining ?? { current: 0, total: 0, unit: '' }}
                        claimAmount={reward?.amount ?? 0}
                        onClaim={handleClaim}
                        onNudge={handleNudge}
                    />
                </TopRow>
                <CrewProgressBar progress={progress} />
            </ContentWrapper>
        </Wrapper>
    );
}
