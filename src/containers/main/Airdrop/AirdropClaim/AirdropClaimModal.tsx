import React, { useState, useEffect } from 'react';
import GreenModal from '@app/components/GreenModal/GreenModal.tsx';
import { useBackgroundClaimSubmission } from '@app/hooks/airdrop/claim/useBackgroundClaimSubmission';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import { useAirdropStore } from '@app/store';
import { setClaimInProgress, setClaimResult } from '@app/store/actions/airdropStoreActions';

interface AirdropClaimModalProps {
    showModal: boolean;
    onClose: () => void;
}

export default function AirdropClaimModal({ showModal, onClose }: AirdropClaimModalProps) {
    const [selectedTarget, setSelectedTarget] = useState<'xtm' | 'usd'>('xtm');
    const claimState = useAirdropStore((state) => state.claim);
    const { performBackgroundClaim, isProcessing, currentStep, error } = useBackgroundClaimSubmission();
    const { data: claimStatus, isLoading: isLoadingStatus } = useClaimStatus(showModal);

    const handleClaim = async () => {
        if (!claimStatus?.hasClaim || isProcessing) {
            return;
        }

        setClaimInProgress(true);

        try {
            const result = await performBackgroundClaim(selectedTarget);
            setClaimResult(result);
            
            // Close modal on success after a brief delay to show success state
            if (result.success) {
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            setClaimResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    const getStepProgress = () => {
        const steps = ['csrf', 'otp-request', 'otp-wait', 'claim-submit', 'complete'];
        const currentIndex = steps.indexOf(currentStep);
        return Math.max(0, currentIndex + 1);
    };

    const getStepText = () => {
        switch (currentStep) {
            case 'csrf':
                return 'Getting security token...';
            case 'otp-request':
                return 'Requesting verification...';
            case 'otp-wait':
                return 'Waiting for verification...';
            case 'claim-submit':
                return 'Submitting claim...';
            case 'complete':
                return 'Claim successful!';
            default:
                return 'Ready to claim';
        }
    };

    const isDisabled = isProcessing || isLoadingStatus || !claimStatus?.hasClaim;

    // Reset selected target when modal opens and there's claim data
    useEffect(() => {
        if (showModal && claimStatus?.claimTarget) {
            setSelectedTarget(claimStatus.claimTarget);
        }
    }, [showModal, claimStatus?.claimTarget]);

    return (
        <GreenModal showModal={showModal} onClose={onClose} padding={24}>
            <div className="w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Airdrop Claim
                </h2>

                {isLoadingStatus ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking claim status...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                ) : !claimStatus?.hasClaim ? (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💎</span>
                            </div>
                        </div>
                        <h3 className="font-semibold text-gray-700 mb-2">No Claims Available</h3>
                        <p className="text-gray-600 text-sm">
                            Continue mining to earn airdrop rewards. Claims will appear here when available.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Claim Status */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-800 mb-3">🎉 Claim Available!</h3>
                            <div className="space-y-2 text-sm text-green-700">
                                <div className="flex justify-between">
                                    <span>Amount:</span>
                                    <span className="font-medium">{claimStatus.amount} XTM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>USD Value:</span>
                                    <span className="font-medium">${claimStatus.usdtAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Available Since:</span>
                                    <span className="font-medium">
                                        {new Date(claimStatus.claimDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Target Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Choose Claim Type:
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="claimTarget"
                                        value="xtm"
                                        checked={selectedTarget === 'xtm'}
                                        onChange={(e) => setSelectedTarget(e.target.value as 'xtm')}
                                        disabled={isProcessing}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Tari (XTM)</div>
                                        <div className="text-sm text-gray-600">{claimStatus.amount} XTM</div>
                                    </div>
                                </label>
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="claimTarget"
                                        value="usd"
                                        checked={selectedTarget === 'usd'}
                                        onChange={(e) => setSelectedTarget(e.target.value as 'usd')}
                                        disabled={isProcessing}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">USDT (Stablecoin)</div>
                                        <div className="text-sm text-gray-600">${claimStatus.usdtAmount} USDT</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        {isProcessing && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-800">Processing Claim</span>
                                    <span className="text-xs text-blue-600">{getStepProgress()}/5</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(getStepProgress() / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-blue-700">{getStepText()}</p>
                            </div>
                        )}

                        {/* Claim Button */}
                        <button
                            onClick={handleClaim}
                            disabled={isDisabled}
                            className={`
                                w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
                                ${isDisabled 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
                                }
                                ${isProcessing ? 'animate-pulse' : ''}
                            `}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isProcessing && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>
                                    {isProcessing 
                                        ? 'Processing...' 
                                        : `Claim ${selectedTarget === 'xtm' ? `${claimStatus.amount} XTM` : `$${claimStatus.usdtAmount} USDT`}`
                                    }
                                </span>
                            </div>
                        </button>

                        {/* How it works */}
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                            <p className="font-medium mb-2">How it works:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Security tokens are fetched automatically</li>
                                <li>Verification is handled in the background</li>
                                <li>Your claim is submitted securely</li>
                                <li>You'll see a confirmation when complete</li>
                            </ol>
                            <p className="mt-2 text-gray-400">Entire process takes 10-30 seconds</p>
                        </div>
                    </div>
                )}
            </div>
        </GreenModal>
    );
}
