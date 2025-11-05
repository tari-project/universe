/**
 * Example implementation showing how to use the tranche system
 * This file demonstrates the key integration patterns for the tranche system
 */

import React from 'react';
import {
    useCurrentMonthTranche,
    useBalanceSummary,
    useTrancheAutoRefresh,
    useTrancheStatus,
} from '@app/hooks/airdrop/tranches';
import { MonthlyTrancheClaimModal, TrancheStatusCard, TrancheBalanceSummary } from '@app/components/airdrop';

// Example 1: Dashboard component with tranche overview
export function AirdropDashboard() {
    const { data: trancheStatus, isLoading } = useTrancheStatus();
    const balanceSummary = useBalanceSummary();

    // Enable auto-refresh for the dashboard
    useTrancheAutoRefresh({
        enabled: true,
        notifyOnNewTranches: true,
    });

    if (isLoading) {
        return <div>Loading airdrop data...</div>;
    }

    return (
        <div className="airdrop-dashboard">
            <h2>Your Airdrop Progress</h2>

            {/* Balance summary at the top */}
            <TrancheBalanceSummary />

            {/* Detailed status card */}
            <TrancheStatusCard />

            {/* Show some key metrics */}
            {trancheStatus && (
                <div className="quick-stats">
                    <p>Available to claim: {trancheStatus.availableCount} tranches</p>
                    <p>
                        Total progress: {trancheStatus.claimedCount}/{trancheStatus.totalTranches}
                    </p>
                    {balanceSummary && <p>Pending balance: {balanceSummary.totalPending.toLocaleString()} XTM</p>}
                </div>
            )}
        </div>
    );
}

// Example 2: Claim button component
export function TrancheClaimButton() {
    const { currentTranche, hasCurrentTranche } = useCurrentMonthTranche();
    const [showModal, setShowModal] = React.useState(false);

    if (!hasCurrentTranche) {
        return (
            <button disabled className="claim-button disabled">
                No tranches available
            </button>
        );
    }

    return (
        <>
            <button onClick={() => setShowModal(true)} className="claim-button available">
                Claim {currentTranche?.amount.toLocaleString()} XTM
            </button>

            <MonthlyTrancheClaimModal showModal={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}

// Example 3: Hook for handling claim success events
export function useClaimEventHandling() {
    const { refreshTranches } = useTrancheAutoRefresh({ enabled: false });

    React.useEffect(() => {
        const handleClaimSuccess = () => {
            console.log('Claim successful, refreshing tranche data');
            refreshTranches();
        };

        // Listen for custom events or integrate with your event system
        window.addEventListener('tranche-claimed', handleClaimSuccess);

        return () => {
            window.removeEventListener('tranche-claimed', handleClaimSuccess);
        };
    }, [refreshTranches]);
}

// Example 4: Complete integration in a main component
export function AirdropSection() {
    const { hasCurrentTranche } = useCurrentMonthTranche();
    const balanceSummary = useBalanceSummary();

    // Enable global auto-refresh
    useTrancheAutoRefresh({
        enabled: true,
        notifyOnNewTranches: true,
        onRefreshSuccess: () => {
            console.log('Tranche data updated');
        },
        onRefreshError: (error) => {
            console.error('Failed to refresh tranche data:', error);
        },
    });

    // Handle claim events
    useClaimEventHandling();

    return (
        <div className="airdrop-section">
            {/* Show balance summary if we have data */}
            {balanceSummary && (
                <div className="balance-overview">
                    <h3>Your XTM Allocation</h3>
                    <TrancheBalanceSummary showTitle={false} />
                </div>
            )}

            {/* Show claim button if tranche is available */}
            {hasCurrentTranche && (
                <div className="claim-section">
                    <h3>Ready to Claim</h3>
                    <TrancheClaimButton />
                </div>
            )}

            {/* Show full dashboard */}
            <AirdropDashboard />
        </div>
    );
}

// Example 5: Using store actions directly (advanced usage)
export function useDirectStoreIntegration() {
    const trancheStatus = useAirdropStore((state) => state.trancheStatus);
    const balanceSummary = useAirdropStore((state) => state.balanceSummary);

    // Example of optimistic updates
    const handleOptimisticClaim = React.useCallback((trancheId: string) => {
        // This would be called before the actual API call
        markTrancheAsClaimed(trancheId, new Date().toISOString(), 833.33);

        // Then make the actual API call...
        // If it fails, you would revert the optimistic update
    }, []);

    return {
        trancheStatus,
        balanceSummary,
        handleOptimisticClaim,
    };
}

// Import necessary store actions for the last example
import { useAirdropStore } from '@app/store';
import { markTrancheAsClaimed } from '@app/store/actions/airdropStoreActions';
