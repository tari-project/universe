import React from 'react';
import { AirdropClaimButton } from './AirdropClaimButton';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';

/**
 * Example component demonstrating how to integrate the airdrop claim functionality
 * This shows the complete usage pattern for the automated claim system
 */
export const AirdropClaimExample: React.FC = () => {
    const { data: claimStatus, isLoading: isLoadingStatus, error: statusError } = useClaimStatus();

    if (statusError) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
                <h3 className="font-semibold text-red-800">Error Loading Claim Status</h3>
                <p className="text-red-600">{statusError.message}</p>
            </div>
        );
    }

    if (isLoadingStatus) {
        return (
            <div className="p-4 bg-gray-100 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Airdrop Claim</h2>
            
            {claimStatus?.hasClaim ? (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 mb-2">Claim Available!</h3>
                        <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Amount:</strong> {claimStatus.amount} {claimStatus.claimTarget.toUpperCase()}</p>
                            <p><strong>USD Value:</strong> ${claimStatus.usdtAmount}</p>
                            <p><strong>Available Since:</strong> {new Date(claimStatus.claimDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <AirdropClaimButton 
                            claimTarget="xtm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Claim {claimStatus.amount} XTM
                        </AirdropClaimButton>
                        
                        <AirdropClaimButton 
                            claimTarget="usd"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            Claim ${claimStatus.usdtAmount} USDT
                        </AirdropClaimButton>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-4">
                        <p><strong>How it works:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                            <li>Click the claim button to start the automated process</li>
                            <li>System fetches security token and requests OTP via secure WebSocket</li>
                            <li>OTP is automatically validated in the background</li>
                            <li>Claim is submitted and you'll see a success notification</li>
                            <li>Entire process takes 10-30 seconds</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">No Claims Available</h3>
                    <p className="text-gray-600 text-sm">
                        Continue mining to earn airdrop rewards. Claims will appear here when available.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AirdropClaimExample;
