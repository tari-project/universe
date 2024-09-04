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

    background: ${(props) => (props.$color === 'green' ? '#47D85E' : '#FF0000')};
`;

export const MenuWrapper = styled('div')`
    position: relative;
`;

export const StyledAvatar = styled('img')`
    position: relative;
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.25rem;
    line-height: 1;
    border-radius: 50%;
    overflow: hidden;
    user-select: none;
    color: rgb(18, 18, 18);
    background-color: rgb(117, 117, 117);
    pointer-events: all;
    cursor: pointer;
    width: 36px;
    height: 36px;
`;

export const Menu = styled(motion.div)`
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    float: left;
    min-width: 10rem;
    margin: 0.125rem 0 0;
    font-size: 1rem;
    color: #212529;
    text-align: left;
    list-style: none;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.175);
    padding: 0.5rem 0;
`;

export const MenuItem = styled('button')`
    padding: 0.5rem 0;
    pointer-events: all;
    cursor: pointer;
    display: block;
    padding: 0.25rem 1.5rem;
    clear: both;
    font-weight: 400;
    color: #212529;
    text-align: inherit;
    white-space: nowrap;
    background-color: transparent;
    border: 0;
    width: 180px;
    z-index: 1000;
    transition: background-color 0.2s ease;
    &:hover {
        background-color: #f8f9fa;
    }
`;
