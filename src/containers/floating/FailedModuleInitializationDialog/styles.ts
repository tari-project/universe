import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

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
    width: clamp(540px, 55vw, 700px);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
`;

export const HeaderWrapper = styled.div`
    flex-shrink: 0;
    padding: 4px 0;
`;

export const DescriptionText = styled.div<{ $allModulesFailed?: boolean }>`
    color: ${({ $allModulesFailed, theme }) => ($allModulesFailed ? theme.colors.warning[600] : '#b0b0b0')};
    flex-shrink: 0;
    font-size: 14px;
    line-height: 1.2;
`;

export const ModuleListWrapper = styled.div`
    flex: 1;
    overflow: auto;
    gap: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const GlobalActionsWrapper = styled.div`
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    flex-shrink: 0;
    gap: 12px;
    display: flex;
    width: 100%;
`;

// Module Status Display Components
export const ModuleStatusWrapper = styled.div`
    display: flex;
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.background.default, 0.35)};
    border-radius: 10px;
    flex-direction: column;
    gap: 8px;
`;

export const ModuleHeaderWrapper = styled.div`
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    justify-content: space-between;
`;

export const ModuleInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const StatusText = styled.div<{ $statusColor: string }>`
    color: ${({ $statusColor }) => $statusColor};
    padding: 0 8px 0;
`;

export const ErrorContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px 0 0;
    gap: 14px;
`;

export const ErrorMessageWrapper = styled.div`
    border-radius: 6px;
    position: relative;
    display: flex;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.errorDarkAlpha[10]};
    background-color: ${({ theme }) => theme.palette.background.paper};
`;

export const PhaseLabel = styled.div`
    position: absolute;
    display: flex;
    top: -8px;
    right: 8px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => (theme.mode == 'dark' ? theme.colors.orange[200] : theme.palette.warning.main)};
    font-size: 10px;
    font-weight: 500;
    font-family: inherit;
    padding: 2px 4px;
    border-radius: 6px;
    text-transform: capitalize;
    letter-spacing: 0.06rem;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.warningDarkAlpha[20]};
`;

export const ErrorMessage = styled.code`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: 12px;
    font-weight: 500;
    line-height: 1.325;
    display: flex;
    white-space: pre-wrap;
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
