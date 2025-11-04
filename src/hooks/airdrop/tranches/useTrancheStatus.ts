import { useQuery } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import type { TrancheStatus, BalanceSummary } from '@app/types/airdrop-claim';
import { useAirdropStore } from '@app/store';

export const KEY_TRANCHE_STATUS = 'tranche_status';

interface TrancheStatusResponse {
    success: boolean;
    data: TrancheStatus;
}

async function fetchTrancheStatus(): Promise<TrancheStatus> {
    const response = await handleAirdropRequest<TrancheStatusResponse>({
        path: '/airdrop/tranches/status',
        method: 'GET',
    });

    if (!response?.success || !response?.data) {
        throw new Error('Failed to fetch tranche status');
    }

    return response.data;
}

export function useTrancheStatus(enabled = true) {
    const user = useAirdropStore((state) => state.userDetails?.user?.id);
    
    return useQuery({
        queryKey: [KEY_TRANCHE_STATUS, user],
        queryFn: fetchTrancheStatus,
        enabled: !!user && enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchInterval: (query) => {
            // Refetch when tranches are available or when approaching next availability
            const data = query.state.data;
            if (!data) return false;
            
            // If we have available tranches, check every 30 seconds
            if (data.availableCount > 0) {
                return 30 * 1000;
            }
            
            // If next tranche is within an hour, check every 5 minutes
            if (data.nextAvailable) {
                const nextTime = new Date(data.nextAvailable).getTime();
                const now = Date.now();
                const timeDiff = nextTime - now;
                
                if (timeDiff <= 60 * 60 * 1000) { // 1 hour
                    return 5 * 60 * 1000; // 5 minutes
                }
            }
            
            // Otherwise, check every 15 minutes
            return 15 * 60 * 1000;
        },
    });
}

// Helper hook to calculate balance summary from tranche data
export function useBalanceSummary(): BalanceSummary | null {
    const { data: trancheStatus } = useTrancheStatus();
    
    if (!trancheStatus) return null;
    
    const totalXtm = trancheStatus.tranches.reduce((sum, tranche) => sum + tranche.amount, 0);
    const totalClaimed = trancheStatus.tranches
        .filter(tranche => tranche.claimed)
        .reduce((sum, tranche) => sum + tranche.amount, 0);
    
    const now = new Date();
    const totalExpired = trancheStatus.tranches
        .filter(tranche => !tranche.claimed && new Date(tranche.validTo) < now)
        .reduce((sum, tranche) => sum + tranche.amount, 0);
    
    const totalPending = totalXtm - totalClaimed - totalExpired;
    
    return {
        totalXtm,
        totalClaimed,
        totalPending,
        totalExpired,
    };
}

// Helper hook to get available tranches
export function useAvailableTranches() {
    const { data: trancheStatus, ...rest } = useTrancheStatus();
    
    const availableTranches = trancheStatus?.tranches.filter(tranche => tranche.canClaim) || [];
    
    return {
        availableTranches,
        hasAvailable: availableTranches.length > 0,
        trancheStatus,
        ...rest,
    };
}

// Helper hook to get current month's available tranche
export function useCurrentMonthTranche() {
    const { availableTranches } = useAvailableTranches();
    
    // For monthly tranches, we typically want the earliest available one
    const currentTranche = availableTranches.length > 0 ? availableTranches[0] : null;
    
    return {
        currentTranche,
        hasCurrentTranche: !!currentTranche,
    };
}
