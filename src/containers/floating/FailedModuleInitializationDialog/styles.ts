import styled from 'styled-components';

export const CloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 4px;
    min-width: 32px;
    min-height: 32px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    z-index: 10;
    background: transparent;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    color: ${({ theme }) => theme.palette.text.secondary};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: transform 0.2s ease-in-out;

    &:hover {
        transform: scale(1.025);
    }
`;

export const DialogWrapper = styled.div`
    max-width: 600px;
    padding: 24px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const HeaderWrapper = styled.div`
    flex-shrink: 0;
`;

export const DescriptionText = styled.div<{ $allModulesFailed?: boolean }>`
    color: ${({ $allModulesFailed }) => ($allModulesFailed ? '#d85240' : '#b0b0b0')};
    flex-shrink: 0;
`;

export const ModuleListWrapper = styled.div`
    flex: 1;
    overflow: auto;
    padding-right: 12px;
    margin-right: -8px;
`;

export const GlobalActionsWrapper = styled.div`
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    flex-shrink: 0;
`;

// Module Status Display Components
export const ModuleStatusWrapper = styled.div`
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: 8px;
    background-color: ${({ theme }) => theme.palette.background.default};
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const ModuleHeaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const ModuleInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const StatusText = styled.div<{ $statusColor: string }>`
    color: ${({ $statusColor }) => $statusColor};
    font-weight: 500;
    font-size: 14px;
`;

export const ErrorContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ErrorMessageWrapper = styled.div`
    position: relative;
    margin-left: 16px;
    margin-top: 12px;
    border: 1px solid #d85240;
    border-radius: 6px;
    padding: 24px 12px 12px 12px;
    background-color: ${({ theme }) => theme.colorsAlpha.errorDarkAlpha[10]};
`;

export const PhaseLabel = styled.div`
    position: absolute;
    top: -8px;
    left: 12px;
    background-color: ${({ theme }) => theme.colors.red[950]};
    color: ${({ theme }) => theme.colors.red[300]};
    font-size: 10px;
    font-weight: 500;
    font-family: inherit;
    padding: 2px 6px;
    border-radius: 2px;
    text-transform: capitalize;
    letter-spacing: 0.05rem;
    border: 1px solid #4a3a3a;
`;

export const ErrorMessage = styled.div`
    color: ${({ theme }) => theme.palette.error.main};
    font-size: 13px;
    font-family: monospace;
    line-height: 1.4;
    display: block;
`;

export const NoErrorMessage = styled.div`
    color: #e89b91;
    font-size: 13px;
    margin-left: 16px;
    font-style: italic;
`;

export const ModuleActionsWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
`;
