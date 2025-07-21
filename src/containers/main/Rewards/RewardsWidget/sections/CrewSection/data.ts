interface User {
    avatar: string;
    isOnline: boolean;
}

interface Reward {
    amount: number;
    token: string;
}

interface TimeRemaining {
    current: number;
    total: number;
    unit: string;
}

type CrewStatus = 'completed' | 'in_progress' | 'needs_nudge';

interface CrewEntry {
    id: number;
    handle: string;
    progress: number;
    status: CrewStatus;
    user: User;
    reward?: Reward;
    timeRemaining?: TimeRemaining;
    canNudge?: boolean;
}

const crewList: CrewEntry[] = [
    {
        id: 1,
        handle: '@airdrop_handle',
        progress: 100,
        status: 'completed',
        reward: { amount: 100, token: 'XTM' },
        user: { avatar: 'user1_avatar.jpg', isOnline: true },
    },
    {
        id: 2,
        handle: '@airdrop_handle',
        progress: 80,
        status: 'in_progress',
        timeRemaining: { current: 36, total: 52, unit: 'Hours' },
        user: { avatar: 'user2_avatar.jpg', isOnline: true },
    },
    {
        id: 3,
        handle: '@airdrop_handle',
        progress: 60,
        status: 'in_progress',
        timeRemaining: { current: 22, total: 52, unit: 'Hours' },
        user: { avatar: 'user3_avatar.jpg', isOnline: true },
    },
    {
        id: 4,
        handle: '@airdrop_handle',
        progress: 40,
        status: 'in_progress',
        timeRemaining: { current: 13, total: 52, unit: 'Hours' },
        user: { avatar: 'user4_avatar.jpg', isOnline: true },
    },
    {
        id: 5,
        handle: '@airdrop_handle',
        progress: 15,
        status: 'needs_nudge',
        canNudge: true,
        user: { avatar: 'user5_avatar.jpg', isOnline: false },
    },
    {
        id: 6,
        handle: '@airdrop_handle',
        progress: 0,
        status: 'needs_nudge',
        canNudge: true,
        user: { avatar: 'user6_avatar.jpg', isOnline: false },
    },
];

export type { User, Reward, TimeRemaining, CrewStatus, CrewEntry };
export { crewList };
