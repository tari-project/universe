import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 10px;

    width: 100%;
    padding: 15px 20px 20px 20px;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);

    position: relative;
    height: auto;
`;

export const TitleWrapper = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const Title = styled('div')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
`;
