import React, { useState } from 'react';
import { useClaimStatus } from '@app/hooks/airdrop/claim/useClaimStatus';
import AirdropClaimModal from '@app/containers/main/Airdrop/AirdropClaim/AirdropClaimModal';

interface AirdropClaimButtonProps {
    className?: string;
    children?: React.ReactNode;
}

export const AirdropClaimButton: React.FC<AirdropClaimButtonProps> = ({
    className = '',
    children,
}) => {
    const [showModal, setShowModal] = useState(false);
    const { data: claimStatus, isLoading: isLoadingStatus } = useClaimStatus();

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const getButtonText = () => {
        if (isLoadingStatus) {
            return 'Checking Status...';
        }

        if (!claimStatus?.hasClaim) {
            return 'No Claims Available';
        }

        return children || `Claim ${claimStatus.amount} XTM`;
    };

    const isDisabled = isLoadingStatus || !claimStatus?.hasClaim;

    return (
        <>
            <button
                onClick={handleOpenModal}
                disabled={isDisabled}
                className={`
                    px-6 py-3 rounded-lg font-medium transition-all duration-200
                    ${isDisabled 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
                    }
                    ${className}
                `}
                aria-label={String(getButtonText())}
            >
                <div className="flex items-center justify-center gap-2">
                    {isLoadingStatus && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{getButtonText()}</span>
                </div>
            </button>

            <AirdropClaimModal 
                showModal={showModal} 
                onClose={handleCloseModal} 
            />
        </>
    );
};

export default AirdropClaimButton;
