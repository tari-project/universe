import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;

    height: 21px;
    padding: 0 10px 0 8px;
    width: max-content;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.component.main};

    color: ${({ theme }) => theme.palette.component.contrast};

    font-size: 11px;
    font-weight: 600;
    line-height: 100%;
    white-space: nowrap;

    transform: translateY(1px);

    span {
        color: ${({ theme }) => theme.palette.component.accent};
    }
`;

export const Divider = styled('div')`
    width: 1px;
    height: 12px;

    background: rgba(255, 255, 255, 0.2);
`;
