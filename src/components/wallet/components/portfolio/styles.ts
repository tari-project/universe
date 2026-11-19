import styled from 'styled-components';

export const PortfolioWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 4px 2px 0 2px;
`;

export const PortfolioHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

export const ChangeBadge = styled.span<{ $positive: boolean }>`
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    padding: 3px 6px;
    border-radius: 6px;
    color: ${({ theme, $positive }) => ($positive ? theme.palette.success.main : theme.palette.error.main)};
    background: ${({ theme, $positive }) =>
        `color-mix(in srgb, ${$positive ? theme.palette.success.main : theme.palette.error.main} 12%, transparent)`};
`;

export const ChartSvg = styled.svg`
    width: 100%;
    height: 56px;
    display: block;
`;
