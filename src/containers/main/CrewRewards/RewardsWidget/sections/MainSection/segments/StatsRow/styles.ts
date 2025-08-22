import styled from 'styled-components';

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

export const PhotoWrapper = styled.div`
    display: flex;
    align-items: center;
    position: relative;
`;

export const PhotoImage = styled.img<{ $image: string }>`
    width: 32px;
    height: 32px;
    border-radius: 100px;
    background: url(${({ $image }) => $image}) no-repeat center center;
    background-size: cover;
    border: 2px solid #323333;
    position: relative;

    &:not(:first-child) {
        margin-left: -17px;
    }

    &:nth-child(1) {
        z-index: 3;
    }

    &:nth-child(2) {
        z-index: 2;
    }

    &:nth-child(3) {
        z-index: 1;
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
