import { LeaderboardPlaceholder, Wrapper } from './styles';
import LeaserboardEntry from './LeaserboardEntry/LeaserboardEntry';
import { useCallback, useEffect, useState } from 'react';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { LeaderboardResponse } from '@app/types/sosTypes';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';

export default function LeaderboardList() {
    const fetchHandler = useAirdropRequest();
    const userId = useAirdropStore((state) => state.userDetails?.user.id);
    const setTotalTimeBonus = useShellOfSecretsStore((s) => s.setTotalTimeBonus);
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
                if (data.userRank) {
                    setTotalTimeBonus(data.userRank.total_time_bonus);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchHandler]);

    useEffect(() => {
        handleLeaderboardData();
        const interval = setInterval(handleLeaderboardData, 1000 * 60);
        return () => clearInterval(interval);
    }, [handleLeaderboardData]);

    return (
        <Wrapper>
            {leaderboardData?.top100
                ? leaderboardData.top100.map((entry) => (
                      <LeaserboardEntry key={entry.id} entry={entry} isCurrentUser={entry.id === userId} />
                  ))
                : Array.from({ length: 100 }).map((_, index) => <LeaderboardPlaceholder key={index} />)}
        </Wrapper>
    );
}
