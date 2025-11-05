import styled from 'styled-components';

export const SummaryContainer = styled.div`
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const SummaryTitle = styled.h4`
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
`;

export const TotalSection = styled.div`
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 8px;
`;

export const TotalAmount = styled.div`
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
`;

export const TotalLabel = styled.div`
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

export const BalanceGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
`;

export const BalanceItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    border-radius: 6px;
    background: #f9fafb;
`;

export const BalanceAmount = styled.div<{ $type: 'claimed' | 'pending' | 'expired' }>`
    font-size: 20px;
    font-weight: 600;

    ${({ $type }) => {
        switch ($type) {
            case 'claimed':
                return 'color: #059669;';
            case 'pending':
                return 'color: #3B82F6;';
            case 'expired':
                return 'color: #DC2626;';
            default:
                return 'color: #1F2937;';
        }
    }}
`;

export const BalanceLabel = styled.div`
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.3px;
`;

export const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: #6b7280;
`;

export const LoadingSpinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;
