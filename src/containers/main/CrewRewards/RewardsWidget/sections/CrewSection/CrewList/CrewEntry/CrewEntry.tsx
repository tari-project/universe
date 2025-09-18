import { useState } from 'react';
import { claimCrewRewards, sendCrewNudge } from '@app/store/actions/airdropStoreActions';
import { useCrewMembers } from '@app/hooks/crew/useCrewMembers';
import { type CrewEntry } from '../../data';
import { ContentWrapper, Wrapper, TopRow, Username } from './styles';
import CrewAvatar from './CrewAvatar/CrewAvatar';
import CrewProgressBar from './CrewProgressBar/CrewProgressBar';
import CrewProgressPill from './CrewProgressPill/CrewProgressPill';
import CrewActionFeedback from './CrewActionFeedback/CrewActionFeedback';
import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';

interface Props {
    entry: CrewEntry & { memberId?: string; claimableRewardId?: string };
    isClaimed?: boolean;
    minDaysRequired?: number;
}

export default function CrewEntry({ entry, isClaimed, minDaysRequired }: Props) {
    const { handle, reward, progress, timeRemaining, status, user, memberId, claimableRewardId } = entry;
    const [isClaimingReward, setIsClaimingReward] = useState(false);
    const [isSendingNudge, setIsSendingNudge] = useState(false);
    const [nudgeCooldowns, setNudgeCooldowns] = useState<Record<string, number>>({});

    const { invalidate: invalidateCrewMembers } = useCrewMembers();
    const { invalidate: invalidateReferrerProgress, data: referrerProgress } = useReferrerProgress();
    const meetsRequirements = referrerProgress?.referrerProgress.meetsMinimumDays;

    const canClaim = progress && progress >= 100;

    // Check if 12 hours have passed since last nudge
    const isNudgeOnCooldown = () => {
        if (memberId && nudgeCooldowns[memberId]) {
            return Date.now() - nudgeCooldowns[memberId] < 12 * 60 * 60 * 1000; // 12 hours
        }

        // Check lastNudgeDate from entry if available
        if (entry.lastNudgeDate) {
            const lastNudgeTime = new Date(entry.lastNudgeDate).getTime();
            return Date.now() - lastNudgeTime < 12 * 60 * 60 * 1000; // 12 hours
        }

        return false;
    };

    const canNudge = status === 'needs_nudge' && !isNudgeOnCooldown();

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
                setTimeout(() => {
                    invalidateCrewMembers();
                    invalidateReferrerProgress();
                }, 1000);
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

            const result = await sendCrewNudge(message, memberId);

            if (result?.success) {
                setShowNudge(true);
            } else {
                console.error('Failed to send nudge');
            }
        } catch (error) {
            console.error('Error sending nudge:', error);
        } finally {
            setIsSendingNudge(false);
            if (memberId) {
                setNudgeCooldowns((prev) => ({
                    ...prev,
                    [memberId]: Date.now(),
                }));
            }
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
            <CrewAvatar image={user.avatar} username={handle} isOnline={user.isOnline} />
            <ContentWrapper>
                <TopRow>
                    <Username>{handle}</Username>
                    <CrewProgressPill
                        canClaim={Boolean(canClaim && !isClaimingReward && meetsRequirements)}
                        canNudge={canNudge && !isSendingNudge}
                        isClaimed={isClaimed ?? false}
                        timeRemaining={timeRemaining ?? { current: 0, total: minDaysRequired || 0, unit: 'Days' }}
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
