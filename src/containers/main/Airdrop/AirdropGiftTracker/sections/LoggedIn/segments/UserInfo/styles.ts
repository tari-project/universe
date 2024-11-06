import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const Wrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 5px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    flex-wrap: nowrap;
    width: 100%;
`;

export const Avatar = styled('div')<{ $image?: string }>`
    background-image: url(${({ $image }) => $image});
    background-size: cover;
    background-position: center;
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
`;

export const Info = styled('div')`
    display: flex;
    flex-direction: column;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export const Name = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.36px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
`;
