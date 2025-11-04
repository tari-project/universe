import styled from 'styled-components';

export const Card = styled.div`
    background: #FFFFFF;
    border-radius: 16px;
    border: 1px solid #E5E7EB;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const CardHeader = styled.div`
    margin-bottom: 20px;
`;

export const CardTitle = styled.h3`
    font-size: 20px;
    font-weight: 600;
    color: #1F2937;
    margin: 0;
`;

export const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const StatusGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    
    @media (min-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

export const StatusItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const StatusLabel = styled.span`
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

export const StatusValue = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #1F2937;
`;

export const ProgressSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ProgressText = styled.span`
    font-size: 14px;
    color: #6B7280;
`;

export const ProgressBar = styled.div`
    width: 100%;
    height: 8px;
    background: #F3F4F6;
    border-radius: 4px;
    overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percentage: number }>`
    height: 100%;
    background: linear-gradient(90deg, #10B981, #059669);
    width: ${({ $percentage }) => Math.min(Math.max($percentage, 0), 100)}%;
    transition: width 0.3s ease;
`;

export const NextTrancheSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: #F9FAFB;
    border-radius: 8px;
    border-left: 4px solid #3B82F6;
`;

export const NextTrancheLabel = styled.span`
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
`;

export const NextTrancheDate = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: #3B82F6;
`;

export const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: #6B7280;
`;

export const LoadingSpinner = styled.div`
    width: 20px;
    height: 20px;
    border: 2px solid #E5E7EB;
    border-top: 2px solid #3B82F6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

export const ErrorContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
`;

export const ErrorText = styled.span`
    color: #DC2626;
    font-size: 14px;
`;
