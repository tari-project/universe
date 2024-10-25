import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 10px;

    width: 100%;
    padding: 15px 15px 20px;

    border-radius: 10px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);

    position: relative;
    height: auto;

    @media (max-height: 670px) {
        padding: 15px 20px 15px 20px;
    }
`;

export const TitleWrapper = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    line-height: 120%;
`;
