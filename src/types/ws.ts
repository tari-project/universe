export enum WebsocketEventNames {
    COMPLETED_QUEST = 'completed_quest',
    COOKIE_CLAIMED = 'cookie_claimed',
    MINING_STATUS_CREW_UPDATE = 'mining_status_crew_update',
    MINING_STATUS_CREW_DISCONNECTED = 'mining_status_crew_disconnected',
    MINING_STATUS_USER_UPDATE = 'mining_status_user_update',
}

export interface QuestCompletedEvent {
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

export interface MiningStatusCrewUpdateEvent {
    name: WebsocketEventNames.MINING_STATUS_CREW_UPDATE;
    data: {
        totalTimeBonusMs: number;
        crewMember: { id: string };
    };
}

export interface MiningStatusUserUpdateEvent {
    name: WebsocketEventNames.MINING_STATUS_USER_UPDATE;
    data: {
        totalTimeBonusMs: number;
    };
}

export interface MiningStatusCrewDisconnectedEvent {
    name: WebsocketEventNames.MINING_STATUS_CREW_DISCONNECTED;
    data: {
        crewMemberId: string;
    };
}

export interface CookieClaimedEvent {
    name: WebsocketEventNames.COOKIE_CLAIMED;
    data: {
        totalTimeBonusMs: number;
    };
}

export type WebsocketUserEvent =
    | QuestCompletedEvent
    | CookieClaimedEvent
    | MiningStatusCrewUpdateEvent
    | MiningStatusUserUpdateEvent
    | MiningStatusCrewDisconnectedEvent;
