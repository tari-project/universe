import { m } from 'framer-motion';
import styled, { css, keyframes } from 'styled-components';

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
`;

export const StatsGroup = styled('div')`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const StatsPill = styled('div')`
    display: flex;
    align-items: center;
    gap: 5px;

    border-radius: 20px;
    background-color: #fff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);

    height: 36px;
    padding: 0 15px;
    pointer-events: all;
    position: relative;
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
    background-color: rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    background-size: cover;
    background-position: center;

    ${({ $img }) =>
        $img &&
        css`
            background-image: url(${$img});
        `}

    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

export const Menu = styled(m.div)`
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 2;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 14px 25px 0px rgba(0, 0, 0, 0.15);

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    min-width: 205px;
    padding: 10px;
    pointer-events: all;

    margin-top: 12px;
`;

export const MenuItem = styled('div')`
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    border-radius: 5px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    width: 100%;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    white-space: nowrap;

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .StatsIcon-gems {
        width: 12px;
        position: relative;
        z-index: 2;
    }
`;

export const MenuWrapper = styled('div')`
    position: relative;
`;

export const GemsAnimation = styled(m.div)`
    position: absolute;
    top: 10px;
    right: 33px;
    z-index: 0;
`;

export const GemImage = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
`;
