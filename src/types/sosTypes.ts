export interface AwardedTimeBonus {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export interface LeaderboardEntry {
    created_at: string;
    updated_at: string;
    id: string;
    user_id: string;
    name: string;
    photo: string;
    total_time_bonus: AwardedTimeBonus;
    rank: string;
    last_mined_at: string;
}

export interface LeaderboardResponse {
    top100: LeaderboardEntry[];
    userRank: LeaderboardEntry;
}

export interface SosCoomieClaimResponse {
    success: boolean;
    message: string;
    addedTimeBonus: AwardedTimeBonus;
    newBalance: AwardedTimeBonus;
    cookie: {
        claimCode: string;
        color: string;
        fortune: string;
        timeBonus: AwardedTimeBonus;
    };
}
