import styled, { css } from 'styled-components';

export const AvatarWrapper = styled.div<{ $status: 'online' | 'offline' }>`
    width: 41px;
    height: 41px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #01a405;
    flex-shrink: 0;

    ${({ $status }) =>
        $status === 'offline' &&
        css`
            border: 2px solid #ff0000;

            ${StatusDot} {
                background-color: #ff0000;
            }
        `}
`;

export const AvatarImage = styled.img``;

export const StatusDot = styled.div`
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: #01a405;

    width: 8.697px;
    height: 8.697px;
    flex-shrink: 0;
`;
