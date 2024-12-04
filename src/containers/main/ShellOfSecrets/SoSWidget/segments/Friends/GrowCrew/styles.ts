import styled from 'styled-components';
import { m } from 'framer-motion';

export const Wrapper = styled('div')`
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
