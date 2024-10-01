import styled from 'styled-components';

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
    background-color: rgba(0, 0, 0, 0.1);
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
    color: #090719;
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 100%;
    letter-spacing: -0.36px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
`;

export const Rank = styled('div')`
    color: rgba(79, 79, 79, 0.75);
    font-size: 12px;
    font-weight: 500;
    line-height: 100%;
    letter-spacing: -0.24px;

    display: flex;
    align-items: center;
    gap: 4px;
`;

export const TrophyImage = styled('img')``;
