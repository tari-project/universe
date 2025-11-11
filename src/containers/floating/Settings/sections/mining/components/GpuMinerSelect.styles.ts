import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
`;

export const TriggerWrapper = styled.div<{ $disabled?: boolean; $isHealthy?: boolean; $hasSelection?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: rgba(0, 0, 0, 0.01);
    padding: 12px 15px;
    min-height: 36px;
    transition: all 0.1s ease;

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: 2px;
    }

    &:hover {
        border-color: ${({ theme, $isHealthy, $hasSelection }) =>
            $hasSelection && $isHealthy !== undefined
                ? ($isHealthy ? theme.palette.success.main : theme.palette.error.main) + '60'
                : theme.palette.primary.main + '60'};
    }

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}

    ${({ $isHealthy, theme }) =>
        $isHealthy === false &&
        css`
            border-color: ${theme.palette.error.main};
            background: rgba(255, 0, 0, 0.05);

            &:hover {
                border-color: ${theme.palette.error.main};
            }
        `}

    ${({ $hasSelection, $isHealthy, theme }) =>
        $hasSelection &&
        css`
            border-color: ${$isHealthy ? theme.palette.success.main : theme.palette.error.main}40;
            background: ${$isHealthy ? theme.palette.success.main : theme.palette.error.main}08;
        `}
`;

export const TriggerContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
    min-width: 0; /* Allow content to shrink */
`;

export const TriggerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const TriggerSummary = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.palette.text.secondary};
    line-height: 1.4;
    margin-top: 2px;
`;

export const HealthIndicator = styled.div<{ $isHealthy: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $isHealthy, theme }) => ($isHealthy ? theme.palette.success.main : theme.palette.error.main)};
`;

export const ChipsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
`;

export const ChipsSeparator = styled.div`
    width: 1px;
    height: 12px;
    background: ${({ theme }) => theme.palette.divider};
    margin: 0 4px;
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const OptionsPosition = styled.div`
    position: absolute;
    width: 100%;
    z-index: 10;
`;

export const Options = styled.div`
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.3);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    height: auto;
    transition: all 0.1s ease-in;
    width: 100%;
    padding: 12px;
    align-items: flex-start;
    gap: 0;
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 500;
    letter-spacing: -1px;
    z-index: 10;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;

    /* Better scrollbar styling */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.palette.divider};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.palette.text.secondary};
    }
`;

export const OptionItem = styled.div<{ $selected?: boolean; $isActive?: boolean; $isHealthy?: boolean }>`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.1s ease;
    flex-shrink: 0;
    border: 1px solid transparent;
    position: relative;
    margin-bottom: 8px;

    &:not(:last-child)::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 12px;
        right: 12px;
        height: 1px;
        background: ${({ theme }) => theme.palette.divider};
    }

    &:hover {
        background: ${({ theme }) => theme.palette.background.accent};
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            background: ${theme.palette.background.accent};
        `}

    ${({ $selected, $isHealthy, theme }) =>
        $selected &&
        css`
            background: ${$isHealthy ? theme.palette.success.main : theme.palette.error.main}25;
            border: 2px solid ${$isHealthy ? theme.palette.success.main : theme.palette.error.main};
            box-shadow:
                0 0 0 1px ${$isHealthy ? theme.palette.success.main : theme.palette.error.main}40,
                0 2px 8px rgba(0, 0, 0, 0.15);

            &::after {
                display: none;
            }
        `}

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: 2px;
    }
`;

export const OptionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const OptionTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const OptionSummary = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.palette.text.secondary};
    line-height: 1.4;
    margin-top: 4px;
`;
