export enum WebsocketEventNames {
    COMPLETED_QUEST = 'completed_quest',
    MINING_STATUS_CREW_UPDATE = 'mining_status_crew_update',
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

export interface MiningStatusCrewUpdateEvent {
    name: WebsocketEventNames.MINING_STATUS_CREW_UPDATE;
    data: {
        totalTimeBonusMs: number;
    };
}

export type WebsocketUserEvent = QuestCompletedEvent | MiningStatusCrewUpdateEvent;
