import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: relative;
    width: 100%;
`;

export const Trigger = styled('div')`
    cursor: pointer;
    width: 100%;
`;

export const Menu = styled(m.div)`
    height: min-content;

    z-index: 2;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;

    padding: 20px;

    border-radius: 15px;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 3px 25px 0 rgba(0, 0, 0, 0.25);

    width: 216px;
`;

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
    position: relative;
`;

export const Text = styled('div')`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
    position: relative;
`;
