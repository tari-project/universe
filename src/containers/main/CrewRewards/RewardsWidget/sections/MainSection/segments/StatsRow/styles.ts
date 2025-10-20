import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
`;

export const ActiveMinersWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const PhotoWrapper = styled.button<{ $isInviteButton?: boolean }>`
    width: 32px;
    height: 32px;
    border-radius: 100%;

    background-color: #404141;
    border: 2px solid #323333;
    position: relative;

    cursor: pointer;
    transition:
        opacity 0.2s ease-in-out,
        transform 0.2s ease-in-out,
        filter 0.2s ease-in-out;

    &:not(:first-child) {
        margin-left: -17px;
    }

    &:nth-child(1) {
        z-index: 1;
    }

    &:nth-child(2) {
        z-index: 2;
    }

    &:nth-child(3) {
        z-index: 3;
    }

    ${({ $isInviteButton }) =>
        $isInviteButton &&
        css`
            color: #404141;

            transition:
                color 0.2s ease-in-out,
                background-color 0.2s ease-in-out,
                filter 0.2s ease-in-out,
                transform 0.2s ease-in-out;

            &:hover {
                z-index: 4;
                color: #fff;
                background-color: #656666;
            }
        `}

    &:hover {
        z-index: 4;

        transform: scale(1) !important;
        filter: blur(0px) !important;
        filter: grayscale(0%) !important;
    }
`;

export const PhotosRow = styled.div`
    display: flex;
    align-items: center;
    position: relative;

    &:hover {
        ${PhotoWrapper} {
            transform: scale(0.8);
            filter: blur(2px) grayscale(100%);
        }
    }
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

export const MainText = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 82.039%;
    letter-spacing: -0.48px;
    white-space: nowrap;
    line-height: 1;

    span {
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
        font-weight: 500;
        letter-spacing: -0.3px;
    }
`;

export const LabelText = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 109.386%;
    letter-spacing: -0.36px;
    opacity: 0.5;
`;

export const Divider = styled.div`
    width: 1px;
    height: 30px;
    opacity: 0.2;
    background: #fff;
`;

export const InviteFriendsMessage = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 125%;
    width: 50%;
    max-width: 170px;
`;

export const LoadingPlaceholder = styled.div`
    width: 100%;
    height: 30px;
`;

export const OnlineIndicator = styled.div<{ $isOnline: boolean }>`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #01a405;
    flex-shrink: 0;
    border: 2px solid #323333;

    position: absolute;
    top: -2px;
    right: -2px;

    ${({ $isOnline }) =>
        !$isOnline &&
        css`
            background-color: #eb3d1e;
        `}
`;
