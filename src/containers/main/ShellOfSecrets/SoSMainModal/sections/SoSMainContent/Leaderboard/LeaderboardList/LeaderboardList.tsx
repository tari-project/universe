import { Wrapper } from './styles';
import LeaserboardEntry from './LeaserboardEntry/LeaserboardEntry';
import { useCallback, useEffect, useState } from 'react';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { LeaderboardResponse } from '@app/types/sosTypes';

export default function LeaderboardList() {
    const fetchHandler = useAirdropRequest();
    const userId = useAirdropStore((state) => state.userDetails?.user.id);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse>();

    const handleLeaderboardData = useCallback(() => {
        fetchHandler<LeaderboardResponse>({
            path: '/sos/leaderboard/all',
            method: 'GET',
        })
            .catch((e) => {
                console.error('Error fetching leaderboard data: ', e);
            })
            .then((data) => {
                if (!data?.top100) return;
                setLeaderboardData(data);
            });
    }, [fetchHandler]);

    useEffect(() => {
        handleLeaderboardData();
        const interval = setInterval(handleLeaderboardData, 1000 * 60);
        return () => clearInterval(interval);
    }, [handleLeaderboardData]);

    return (
        <Wrapper>
            {leaderboardData?.top100.map((entry) => (
                <LeaserboardEntry key={entry.id} entry={entry} isCurrentUser={entry.id === userId} />
            ))}
        </Wrapper>
    );
}
