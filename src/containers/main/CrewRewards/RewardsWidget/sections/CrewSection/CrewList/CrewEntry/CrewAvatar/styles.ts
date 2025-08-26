import styled, { css } from 'styled-components';

export const AvatarWrapper = styled.div<{ $isOnline: boolean; $image: string }>`
    width: 41px;
    height: 41px;
    border-radius: 50%;
    border: 2px solid #01a405;
    flex-shrink: 0;

    background-image: url(${({ $image }) => $image});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    position: relative;

    ${({ $isOnline }) =>
        !$isOnline &&
        css`
            border: 2px solid #eb3d1e;

            ${StatusDot} {
                background-color: #eb3d1e;
            }
        `}
`;

export const StatusDot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #01a405;
    flex-shrink: 0;
    border: 2px solid #434444;

    position: absolute;
    top: -2px;
    right: -2px;
`;
