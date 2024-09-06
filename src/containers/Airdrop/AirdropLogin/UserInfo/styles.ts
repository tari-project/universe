import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

const ring = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(15deg);
  }
  50% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
`;

export const Wrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 13px;
    user-select: none;
`;

export const StatsGroup = styled('div')`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const StatsPill = styled('div')`
    display: flex;
    align-items: center;
    gap: 5px;

    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.05);

    height: 36px;
    padding: 0 15px;
`;

export const StatsNumber = styled('div')`
    color: #000;
    font-size: 15px;
    font-weight: 600;
`;

export const StatsIcon = styled('img')`
    width: 18px;
`;

export const Divider = styled('div')`
    width: 1px;
    height: 28px;
    background: rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
`;

export const NotificationsButton = styled('button')`
    background: none;
    border: none;
    cursor: pointer;
    pointer-events: all;

    position: relative;
    border-radius: 100%;
    border: 1px solid rgba(0, 0, 0, 0.1);

    width: 36px;
    height: 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    .NotificationsButtonIcon {
        width: 16px;
        height: 16px;
    }

    transition: border-color 0.2s ease;

    &:hover {
        border-color: rgba(0, 0, 0, 0.3);

        .NotificationsButtonIcon {
            animation: ${ring} 0.5s ease-in-out;
            transform-origin: top center;
        }
    }
`;

export const Dot = styled('div')<{ $color: 'green' | 'red' }>`
    width: 12px;
    height: 12px;
    border-radius: 100%;

    position: absolute;
    top: -2px;
    right: -2px;

    border: 2px solid #d0d0d0;

    background: ${({ $color }) => ($color === 'green' ? '#47D85E' : '#FF0000')};
`;

export const StyledAvatar = styled('div')<{ $img?: string }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.25rem;
    line-height: 1;
    border-radius: 50%;
    overflow: hidden;
    user-select: none;
    pointer-events: all;
    cursor: pointer;
    background-color: grey;
    width: 36px;
    height: 36px;
    // fit background image
    background-size: cover;
    background-position: center;

    ${({ $img }) => $img && `background-image: url(${$img})`}
`;

export const Menu = styled(motion.div)`
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 12px;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 14px 25px 0px rgba(0, 0, 0, 0.15);

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    width: 194px;
    padding: 10px;
    pointer-events: all;
`;

export const MenuItem = styled('div')`
    color: #000;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;

    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    padding: 10px 15px;
    cursor: pointer;

    transition: background-color 0.2s ease;

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
`;

export const MenuWrapper = styled('div')`
    position: relative;
`;
