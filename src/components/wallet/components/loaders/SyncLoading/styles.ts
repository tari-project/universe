import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.background.accent};

    background: ${({ theme }) =>
        theme.mode === 'dark' ? theme.palette.background.accent : theme.palette.background.paper};

    padding: 17px;

    display: flex;
    gap: 24px;
    align-items: center;
    justify-content: space-between;
`;

export const Text = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    line-height: 154.545%;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    strong {
        color: ${({ theme }) => theme.palette.text.primary};
        font-weight: 700;
    }
`;

export const Line = styled.div``;

export const LoadingWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

export const TooltipPosition = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
`;

export const TooltipContent = styled(m.div)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;

    width: 292px;
    padding: 20px;

    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: 0px 4px 45px 0px rgba(0, 0, 0, 0.08);
`;

export const TooltipTitle = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
`;

export const TooltipDescription = styled.div`
    color: #797979;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 133.333%;
`;
