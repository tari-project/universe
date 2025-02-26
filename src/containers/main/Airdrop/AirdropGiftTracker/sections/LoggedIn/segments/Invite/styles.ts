import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
`;

export const InviteButton = styled('button')`
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;

    height: 50px;
    padding: 12px 14px 12px 13px;

    border-radius: 60px;
    background: #000;
    color: #fff;

    transition: transform 0.2s ease;
    overflow: hidden;
    cursor: pointer;

    svg {
        flex-shrink: 0;
        circle {
            fill: #fff;
        }
        path {
            fill: #000;
        }
    }

    &:hover {
        transform: scale(1.05);
    }

    &:disabled {
        pointer-events: none;
    }
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
`;

export const Image = styled('img')`
    width: 15px;
`;

export const Title = styled('div')`
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    line-height: 120%;
`;

export const Text = styled('div')`
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    line-height: 120%;

    span {
        color: ${({ theme }) => theme.palette.action.background.contrast};
    }
`;

export const GemPill = styled('div')`
    display: flex;
    height: 27px;
    padding: 8px 10px 8px 16px;
    justify-content: center;
    align-items: center;
    gap: 2px;

    border-radius: 100px;
    background: ${({ theme }) => theme.colors.brightGreen[500]};
    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
`;

export const Copied = styled(m.div)`
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;

    background: ${({ theme }) => theme.palette.action.background.secondary};

    color: ${({ theme }) => theme.palette.action.background.contrast};
    text-align: center;
    font-size: 12px;
    font-weight: 600;

    display: flex;
    align-items: center;
    justify-content: center;
`;
