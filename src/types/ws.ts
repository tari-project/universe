import type { XSpaceEventType } from '@app/utils/XSpaceEventType';

export const GLOBAL_EVENT_NAME = 'global-event';

export enum WebsocketEventNames {
    COMPLETED_QUEST = 'completed_quest',
    REFERRAL_INSTALL_REWARD = 'referral_install_reward',
    USER_SCORE_UPDATE = 'user_score_update',
    X_SPACE_EVENT = 'x_space_event',
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

export interface CrewMember {
    imageUrl: string | null;
    id: string;
    name: string;
    profileImageUrl: string | null;
    lastHandshakeAt: Date | null;
    active?: boolean;
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

interface XSpaceEventUpdate {
    name: WebsocketEventNames.X_SPACE_EVENT;
    data: XSpaceEvent | null;
}

export interface XSpaceEvent {
    text: string;
    visibilityEnd: Date;
    visibilityStart: Date;
    goingLive?: Date | null;
    link: string;
    isVisible: boolean;
    type: XSpaceEventType;
    id: string;
}

export interface CrewNudgeEvent {
    name: WebsocketEventNames.CREW_NUDGE;
}

export type WebsocketUserEvent =
    | UserScoreUpdate
    | ReferralInstallRewardEvent
    | QuestCompletedEvent
    | XSpaceEventUpdate
    | CrewNudgeEvent;

export type WebsocketGlobalEvent = XSpaceEventUpdate;
