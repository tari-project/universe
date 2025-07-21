import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)``;

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
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
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
    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 133.333%;
`;
