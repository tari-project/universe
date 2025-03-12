export const GLOBAL_EVENT_NAME = 'global-event';

export enum WebsocketEventNames {
    COMPLETED_QUEST = 'completed_quest',
    MINING_STATUS_CREW_UPDATE = 'mining_status_crew_update',
    MINING_STATUS_CREW_DISCONNECTED = 'mining_status_crew_disconnected',
    REFERRAL_INSTALL_REWARD = 'referral_install_reward',
    MINING_STATUS_USER_UPDATE = 'mining_status_user_update',
    USER_SCORE_UPDATE = 'user_score_update',
    X_SPACE_EVENT = 'x_space_event',
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

interface MiningStatusCrewUpdateEvent {
    name: WebsocketEventNames.MINING_STATUS_CREW_UPDATE;
    data: {
        totalTimeBonusMs: number;
        crewMember: { id: string };
    };
}

interface MiningStatusUserUpdateEvent {
    name: WebsocketEventNames.MINING_STATUS_USER_UPDATE;
    data: {
        totalTimeBonusMs: number;
    };
}

interface MiningStatusCrewDisconnectedEvent {
    name: WebsocketEventNames.MINING_STATUS_CREW_DISCONNECTED;
    data: {
        crewMemberId: string;
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

export enum XSpaceEventType {
    link = 'link',
    event = 'event',
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

export type WebsocketUserEvent =
    | UserScoreUpdate
    | ReferralInstallRewardEvent
    | QuestCompletedEvent
    | MiningStatusCrewUpdateEvent
    | MiningStatusUserUpdateEvent
    | MiningStatusCrewDisconnectedEvent
    | XSpaceEventUpdate;

export type WebsocketGlobalEvent = XSpaceEventUpdate;
