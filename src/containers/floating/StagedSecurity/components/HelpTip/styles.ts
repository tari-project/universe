import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 100;

    border-radius: 10px;
    background: ${({ theme }) => theme.palette.base};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    padding: 20px;
    width: 216px;
    pointer-events: all;
`;

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.contrast};
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
`;

export const Text = styled('div')`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 116.667%;
`;

export const TextButton = styled('button')`
    color: ${({ theme }) => theme.palette.contrast};
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 116.667%;
    text-decoration-line: underline;

    display: inline-flex;
    cursor: pointer;
`;
