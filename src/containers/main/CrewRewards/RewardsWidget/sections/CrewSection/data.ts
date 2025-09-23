import personImage from '../../../images/person1.png';

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
    id: string;
    handle: string;
    progress: number;
    status: CrewStatus;
    user: User;
    reward?: Reward;
    timeRemaining?: TimeRemaining;
    isClaimed?: boolean;
    lastNudgeDate?: Date;
}

const crewList: CrewEntry[] = [
    {
        id: '1',
        handle: '@airdrop_handle',
        progress: 100,
        status: 'completed',
        reward: { amount: 100, token: 'XTM' },
        user: { avatar: personImage, isOnline: true },
        isClaimed: false,
    },
    {
        id: '2',
        handle: '@airdrop_handle',
        progress: 100,
        status: 'completed',
        reward: { amount: 100, token: 'XTM' },
        user: { avatar: personImage, isOnline: false },
        isClaimed: true,
    },
    {
        id: '3',
        handle: '@long_handle_name_that_is_long_and_will_overflow',
        progress: 80,
        status: 'in_progress',
        timeRemaining: { current: 36, total: 52, unit: 'Hours' },
        user: { avatar: personImage, isOnline: true },
    },
    {
        id: '4',
        handle: '@airdrop_handle',
        progress: 60,
        status: 'in_progress',
        timeRemaining: { current: 22, total: 52, unit: 'Hours' },
        user: { avatar: personImage, isOnline: true },
    },
    {
        id: '5',
        handle: '@airdrop_handle',
        progress: 40,
        status: 'in_progress',
        timeRemaining: { current: 13, total: 52, unit: 'Hours' },
        user: { avatar: personImage, isOnline: true },
    },
    {
        id: '6',
        handle: '@airdrop_handle',
        progress: 15,
        status: 'needs_nudge',
        user: { avatar: personImage, isOnline: false },
    },
    {
        id: '7',
        handle: '@airdrop_handle',
        progress: 0,
        status: 'needs_nudge',
        user: { avatar: personImage, isOnline: false },
    },
];

export type { User, Reward, TimeRemaining, CrewStatus, CrewEntry };
export { crewList };
