export enum WebsocketEventNames {
    COMPLETED_QUEST = 'completed_quest',
    REFERRAL_INSTALL_REWARD = 'referral_install_reward',
    USER_SCORE_UPDATE = 'user_score_update',
    CREW_NUDGE = 'crew_nudge',
}

interface QuestCompletedEvent {
    name: WebsocketEventNames.COMPLETED_QUEST;
    data: {
        questName: string;
        userId: string;
        questPointType?: unknown;
        quetPoints?: number;
        userPoints?: {
            gems: number;
            shells: number;
            hammers: number;
        };
    };
}

interface ReferralInstallRewardEvent {
    name: WebsocketEventNames.REFERRAL_INSTALL_REWARD;
}

export interface UserScoreUpdate {
    name: WebsocketEventNames.USER_SCORE_UPDATE;
    data: {
        userId: string;
        userPoints?: {
            gems: number;
            shells: number;
            hammers: number;
        };
    };
}

export interface CrewNudgeEvent {
    name: WebsocketEventNames.CREW_NUDGE;
}

export type WebsocketUserEvent = UserScoreUpdate | ReferralInstallRewardEvent | QuestCompletedEvent | CrewNudgeEvent;
