import type { CrewMember } from '@app/store/useAirdropStore';
import type { CrewEntry, CrewStatus } from './RewardsWidget/sections/CrewSection/data';

export const calculateProgress = (progressTowardsReward: any): number => {
    if (progressTowardsReward.isComplete) return 100;

    // Calculate base progress from completed days
    const completedDaysProgress =
        (progressTowardsReward.miningDaysProgress / progressTowardsReward.totalDaysRequired) * 100;

    // Add current day progress as a fraction of one day
    const currentDayContribution =
        (progressTowardsReward.currentDayProgress / 100) * (100 / progressTowardsReward.totalDaysRequired);

    const totalProgress = completedDaysProgress + currentDayContribution;

    return Math.min(100, totalProgress);
};

export const determineStatus = (member: CrewMember): CrewStatus => {
    const latestReward = member.rewards[0];
    if (!latestReward) return 'needs_nudge';

    // If reward is ready to claim or complete
    if (latestReward.status === 'earned' && latestReward.readyToClaim) {
        return 'completed';
    }

    if (latestReward.progressTowardsReward.isComplete) {
        return 'completed';
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
    const currentDayProgress = latestReward?.progressTowardsReward.currentDayProgress || 0;

    // Consider online if they have good progress today or recent activity
    const isActiveToday = currentDayProgress > 20;
    const recentActivity = Date.now() - new Date(member.lastActivityDate).getTime() < 1000 * 60 * 60 * 2; // 2 hours

    return {
        avatar: member.user?.image || '',
        isOnline: isActiveToday || recentActivity,
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

export const calculateTimeRemaining = (member: CrewMember) => {
    const latestReward = member.rewards[0];
    if (!latestReward || latestReward.progressTowardsReward.isComplete) return undefined;

    const progress = latestReward.progressTowardsReward;
    const daysRemaining = progress.totalDaysRequired - progress.miningDaysProgress;

    if (daysRemaining <= 0) return undefined;

    // Convert days to hours for display
    const hoursRemaining = daysRemaining * 24;

    return {
        current: Math.round(hoursRemaining),
        total: progress.totalDaysRequired * 24, // Total hours for the goal
        unit: daysRemaining > 1 ? 'Days' : 'Hours',
    };
};

export const mapHandle = (member: CrewMember): string => {
    return member.user?.displayName || member.user?.name || 'unknown';
};

export const transformCrewMemberToEntry = (
    member: CrewMember
): CrewEntry & {
    memberId: string;
    claimableRewardId?: string;
} => {
    const status = determineStatus(member);
    const latestReward = member.rewards[0];
    const progress = latestReward ? calculateProgress(latestReward.progressTowardsReward) : 0;
    const claimableReward = member.rewards.find((r) => r.readyToClaim);

    return {
        id: parseInt(member.id),
        handle: mapHandle(member),
        progress,
        status,
        user: mapUserInfo(member),
        reward: mapReward(member),
        timeRemaining: calculateTimeRemaining(member),
        memberId: member.id,
        claimableRewardId: claimableReward?.id,
    };
};
