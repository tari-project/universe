import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled(m.div)`
    width: 100%;
    color: ${({ theme }) => theme.palette.text.secondary};
    display: flex;
    padding: 12px 15px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.colors.gothic[950]};
    box-shadow: 0 4px 65px 0 rgba(90, 90, 90, 0.2);
    height: 269px;

    font-family:
        GTAmerica Standard,
        sans-serif;
`;

export const LeftContent = styled.div`
    align-items: center;
    display: flex;
    gap: 10px;
    flex-shrink: 0;
`;

export const SquadIconWrapper = styled.div`
    border-radius: 100%;
    flex-shrink: 0;
    display: flex;
    width: 32px;
    height: 32px;
    background: linear-gradient(70deg, deeppink, darkorange 72%, orangered);
    align-items: center;
    justify-content: center;

    svg {
        width: 22px;
    }
`;

export const InfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    white-space: pre-wrap;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.26px;
    span {
        color: ${({ theme }) => theme.palette.base};
    }
    p {
        font-weight: 600;
    }
`;
export const EarningsWrapper = styled.div`
    display: flex;
    justify-self: flex-end;
    white-space: pre-wrap;
    letter-spacing: -0.32px;
    flex-shrink: 0;
    font-weight: 600;
    font-size: 16px;
`;
