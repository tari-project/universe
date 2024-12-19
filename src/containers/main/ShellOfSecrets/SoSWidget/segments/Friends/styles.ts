import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

export const FriendsWrapper = styled('div')`
    display: flex;
    padding-left: 10px;
`;

export const Friend = styled('img')<{ $image: string }>`
    width: 33px;
    height: 33px;
    border-radius: 100px;
    border: 1px solid #fff;
    background: #d9d9d9;

    background-image: url(${(props) => props.$image});
    background-size: cover;
    background-position: center;

    margin-left: -10px;
`;

export const FriendCount = styled('div')`
    width: 33px;
    height: 33px;
    border-radius: 100px;
    border: 1px solid #fff;
    background: #d9d9d9;

    color: #050824;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.5px;

    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -10px;
`;

export const Text = styled('div')`
    color: #fff;
    text-align: center;
    font-family: 'IBM Plex Mono', sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
    max-width: 164px;
`;

export const Buttons = styled('div')`
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
`;

export const CopyButtton = styled('div')`
    color: #fff;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(1px);

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    width: 28px;
    height: 28px;

    cursor: pointer;
    transition: background 0.3s ease;
    position: relative;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

export const Copied = styled(m.div)`
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);

    background: #fff;
    border-radius: 7px;
    padding: 4px 8px;
    border: 2px solid #000;

    color: #000;
    font-family: 'IBM Plex Mono', sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    pointer-events: none;
    white-space: nowrap;

    margin-bottom: 5px;
`;

export const GrowButton = styled('div')`
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(1px);

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    height: 28px;
    padding: 0px 13px;

    color: #fff;
    font-family: 'IBM Plex Mono', sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    white-space: nowrap;

    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

export const PositionArrows = styled('div')`
    position: absolute;
    top: -20px;
    right: 12px;
`;
