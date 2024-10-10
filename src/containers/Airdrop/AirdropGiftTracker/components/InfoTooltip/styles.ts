import { m } from 'framer-motion';
import styled from 'styled-components';

export const Trigger = styled(m.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;

    flex-shrink: 0;

    color: #9f9f9f;
`;

export const Menu = styled(m.div)`
    z-index: 2;
    position: absolute;
    top: 0px;
    right: 0px;

    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;

    padding: 20px;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 4px 45px 0px rgba(0, 0, 0, 0.08);

    width: 100%;
    max-width: 216px;
`;

export const Title = styled('div')`
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
`;

export const Text = styled('div')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;
