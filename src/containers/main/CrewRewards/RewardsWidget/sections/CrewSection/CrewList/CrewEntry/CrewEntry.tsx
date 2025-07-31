import { useState } from 'react';
import { claimCrewRewards, sendCrewNudge, fetchCrewMembers } from '@app/store/actions/airdropStoreActions';
import { type CrewEntry } from '../../data';
import { ContentWrapper, Wrapper, TopRow, Username } from './styles';
import CrewAvatar from './CrewAvatar/CrewAvatar';
import CrewProgressBar from './CrewProgressBar/CrewProgressBar';
import CrewProgressPill from './CrewProgressPill/CrewProgressPill';
import CrewActionFeedback from './CrewActionFeedback/CrewActionFeedback';

interface Props {
    entry: CrewEntry & { memberId?: string; claimableRewardId?: string };
    isClaimed?: boolean;
}

export default function CrewEntry({ entry, isClaimed }: Props) {
    const { handle, reward, progress, timeRemaining, status, user, memberId, claimableRewardId } = entry;
    const [isClaimingReward, setIsClaimingReward] = useState(false);
    const [isSendingNudge, setIsSendingNudge] = useState(false);

    const canClaim = progress && progress >= 100 && status !== 'completed';
    const canNudge = status === 'needs_nudge';

    const [showNudge, setShowNudge] = useState(false);
    const [showClaim, setShowClaim] = useState(false);

    const handleClaim = async () => {
        if (!reward || !canClaim || isClaimingReward || !claimableRewardId || !memberId) return;

        try {
            setIsClaimingReward(true);

            const result = await claimCrewRewards(claimableRewardId, memberId);

            if (result?.success) {
                console.info('Reward claimed successfully:', result.claimedReward);
                setShowClaim(true);
                // Refresh crew data to show updated state
                await fetchCrewMembers();
            } else {
                console.error('Failed to claim reward');
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
        } finally {
            setIsClaimingReward(false);
        }
    };

    const handleNudge = async () => {
        if (!canNudge || isSendingNudge || !memberId) return;

        try {
            setIsSendingNudge(true);

            const message = `Hey ${handle}, keep up the great work! You're making progress on your mining goals.`;
            const targetMembers = [memberId];

            const result = await sendCrewNudge(message, targetMembers);

            if (result?.success) {
                console.info('Nudge sent successfully');
                // Optionally refresh crew data or show success message
            } else {
                console.error('Failed to send nudge');
            }
        } catch (error) {
            console.error('Error sending nudge:', error);
        } finally {
            setIsSendingNudge(false);
        }
    };

    return (
        <Wrapper $canClaim={!!canClaim} $isClaimed={!!isClaimed}>
            <CrewActionFeedback
                showNudge={showNudge}
                setShowNudge={setShowNudge}
                showClaim={showClaim}
                setShowClaim={setShowClaim}
            />
            <CrewAvatar image={user.avatar} isOnline={user.isOnline} />
            <ContentWrapper>
                <TopRow>
                    <Username>{handle}</Username>
                    <CrewProgressPill
                        canClaim={Boolean(canClaim && !isClaimingReward)}
                        canNudge={canNudge && !isSendingNudge}
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
