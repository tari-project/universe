import { styled, css } from 'styled-components';

export const ModalWrapper = styled.div`
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
`;

export const ModalTitle = styled.h2`
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 24px;
    color: #1f2937;
`;

export const LoadingContainer = styled.div`
    text-align: center;
    padding: 32px 0;
`;

export const LoadingSpinner = styled.div`
    width: 32px;
    height: 32px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #2563eb;
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

export const LoadingText = styled.p`
    color: #6b7280;
    margin: 0;
`;

export const ErrorContainer = styled.div`
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
`;

export const ErrorTitle = styled.h3`
    font-weight: 600;
    color: #991b1b;
    margin: 0 0 8px 0;
`;

export const ErrorText = styled.p`
    color: #dc2626;
    font-size: 14px;
    margin: 0;
`;

export const EmptyStateContainer = styled.div`
    text-align: center;
    padding: 32px 0;
`;

export const EmptyStateIcon = styled.div`
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 32px;
`;

export const EmptyStateTitle = styled.h3`
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
`;

export const EmptyStateText = styled.p`
    color: #6b7280;
    font-size: 14px;
    margin: 0;
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

export const ClaimStatusCard = styled.div`
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 16px;
`;

export const ClaimStatusTitle = styled.h3`
    font-weight: 600;
    color: #166534;
    margin: 0 0 12px 0;
    
    &::before {
        content: '🎉 ';
    }
`;

export const ClaimStatusDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #15803d;
`;

export const ClaimStatusRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const ClaimStatusLabel = styled.span``;

export const ClaimStatusValue = styled.span`
    font-weight: 500;
`;

export const TargetSelectionContainer = styled.div``;

export const TargetSelectionLabel = styled.label`
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 12px;
`;

export const TargetOptions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const TargetOption = styled.label<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.2s ease;
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

    &:hover {
        background: ${({ $disabled }) => ($disabled ? 'transparent' : '#f9fafb')};
    }
`;

export const TargetRadio = styled.input`
    margin-right: 12px;
`;

export const TargetContent = styled.div`
    flex: 1;
`;

export const TargetTitle = styled.div`
    font-weight: 500;
    margin-bottom: 2px;
`;

export const TargetAmount = styled.div`
    font-size: 14px;
    color: #6b7280;
`;

export const ProgressContainer = styled.div`
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 16px;
`;

export const ProgressHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
`;

export const ProgressTitle = styled.span`
    font-size: 14px;
    font-weight: 500;
    color: #1e40af;
`;

export const ProgressCounter = styled.span`
    font-size: 12px;
    color: #2563eb;
`;

export const ProgressBar = styled.div`
    width: 100%;
    background: #bfdbfe;
    border-radius: 9999px;
    height: 8px;
    margin-bottom: 8px;
`;

export const ProgressFill = styled.div<{ $progress: number }>`
    background: #2563eb;
    height: 8px;
    border-radius: 9999px;
    transition: width 0.5s ease;
    width: ${({ $progress }) => $progress}%;
`;

export const ProgressText = styled.p`
    font-size: 14px;
    color: #1d4ed8;
    margin: 0;
`;

export const ClaimButton = styled.button<{ $disabled?: boolean; $processing?: boolean }>`
    width: 100%;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};

    ${({ $disabled, $processing }) => {
        if ($disabled) {
            return css`
                background: #d1d5db;
                color: #6b7280;
            `;
        }
        return css`
            background: #2563eb;
            color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

            &:hover {
                background: #1d4ed8;
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }

            ${$processing && css`
                animation: pulse 2s infinite;
            `}
        `;
    }}

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }
`;

export const ButtonContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

export const ButtonSpinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid white;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

export const HowItWorksContainer = styled.div`
    font-size: 12px;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px;
`;

export const HowItWorksTitle = styled.p`
    font-weight: 500;
    margin: 0 0 8px 0;
`;

export const HowItWorksList = styled.ol`
    list-style: decimal inside;
    margin: 0;
    padding: 0;
    
    li {
        margin-bottom: 4px;
        
        &:last-child {
            margin-bottom: 0;
        }
    }
`;

export const HowItWorksNote = styled.p`
    margin: 8px 0 0 0;
    color: #9ca3af;
`;
