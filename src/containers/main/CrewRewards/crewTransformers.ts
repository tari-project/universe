import type { CrewMember, CrewMemberReward, MinRequirements } from '@app/store/useAirdropStore';
import type { CrewEntry, CrewStatus } from './RewardsWidget/sections/CrewSection/data';

export const calculateProgress = (
    progressTowardsReward: CrewMemberReward['progressTowardsReward'],
    minRequirements: MinRequirements
): number => {
    if (progressTowardsReward.isComplete) return 100;

    // Calculate base progress from completed days
    const completedDaysProgress = (progressTowardsReward.miningDaysProgress / minRequirements.totalDaysRequired) * 100;

    const currentDayProgress = progressTowardsReward.currentDayProgress / minRequirements.minDailyMiningMinutes;
    // Add current day progress as a fraction of one day using minDailyMiningMinutes
    const currentDayContribution = (currentDayProgress * 100) / minRequirements.totalDaysRequired;

    const totalProgress = completedDaysProgress + currentDayContribution;

    return Math.min(100, totalProgress);
};

export const determineStatus = (member: CrewMember): CrewStatus => {
    const latestReward = member.rewards[0];
    const lastActivityMoreThan24HoursAgo =
        Date.now() - new Date(member.lastActivityDate).getTime() > 1000 * 60 * 60 * 24;

    if (!latestReward) return 'needs_nudge';

    // If reward is ready to claim or complete
    if (
        (latestReward.status === 'earned' && latestReward.readyToClaim) ||
        latestReward.progressTowardsReward.isComplete
    ) {
        return 'completed';
    }

    if (lastActivityMoreThan24HoursAgo) {
        return 'needs_nudge';
    }

    // Check current day progress - if very low, might need nudge
    if (latestReward.progressTowardsReward.currentDayProgress < 10) {
        // Also check if they haven't been active recently
        const daysSinceActivity = (Date.now() - new Date(member.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity > 1) {
            return 'needs_nudge';
        }
    }

    return 'in_progress';
};

export const mapUserInfo = (member: CrewMember) => {
    const latestReward = member.rewards[0];
    const lastActivityMoreThan1Hour = Date.now() - new Date(member.lastActivityDate).getTime() > 1000 * 60 * 60;
    return {
        avatar: member.user?.image || '',
        isOnline: !lastActivityMoreThan1Hour && !!latestReward?.active,
    };
};

export const mapReward = (member: CrewMember) => {
    const claimableReward = member.rewards.find((r) => r.status === 'incomplete');
    return claimableReward
        ? {
              amount: claimableReward.amount,
              token: 'XTM', // Default token
          }
        : undefined;
};

export const calculateTimeRemaining = (member: CrewMember, minRequirements: MinRequirements) => {
    const latestReward = member.rewards[0];
    if (!latestReward || latestReward.progressTowardsReward.isComplete) return undefined;

    const progress = latestReward.progressTowardsReward;

    return {
        current: progress.miningDaysProgress,
        total: minRequirements.totalDaysRequired,
        unit: 'Days',
    };
};

export const mapHandle = (member: CrewMember): string => {
    return member.user?.displayName || member.user?.name || 'unknown';
};

export const transformCrewMemberToEntry = (
    member: CrewMember,
    minRequirements: MinRequirements
): CrewEntry & {
    memberId: string;
    claimableRewardId?: string;
} => {
    const status = determineStatus(member);
    const latestReward = member.rewards[0];
    const progress = latestReward ? calculateProgress(latestReward.progressTowardsReward, minRequirements) : 0;
    const claimableReward = member.rewards.find((r) => r.readyToClaim);

    return {
        id: member.id,
        handle: mapHandle(member),
        progress,
        status,
        user: mapUserInfo(member),
        reward: mapReward(member),
        timeRemaining: calculateTimeRemaining(member, minRequirements),
        memberId: member?.user?.id || '',
        claimableRewardId: claimableReward?.id,
    };
};
