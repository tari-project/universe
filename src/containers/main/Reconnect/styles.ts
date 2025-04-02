import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const Wrapper = styled.div`
    pointer-events: all;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0);
    width: 100%;
    height: 100%;
    z-index: 99999 !important;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

export const SubTitle = styled(Typography)`
    font-family: Poppins;
    max-width: 700px;
    font-weight: 400;
    font-size: 18px;
    line-height: 22px;
    letter-spacing: 0%;
    text-align: center;
`;

export const HeaderImgSevere = styled.img`
    width: min(660px, 100vh);
    max-width: 100%;
`;

export const HeaderImg = styled.img`
    width: min(460px, 100vh);
    max-width: 100%;
`;

export const TelegramLogo = styled.img`
    padding-left: 5px;
    display: inline-block;
`;

export const RetryTimer = styled.div`
    display: inline-block;
    border-radius: 50px;
    padding: 15px 30px;
    background: linear-gradient(to right, #ffaf40, #ff825f);
    color: white;
    box-shadow: 0px 0px 34px 0px rgba(255, 213, 167, 0.75);
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: black;
    margin-bottom: 20px;
    align-items: center;
`;

export const SecondaryButton = styled(Typography)`
    display: inline-block;
    width: fit-content;
    cursor: pointer;
    color: black;
    font-family: Poppins;
    font-weight: 600;
    font-size: 18px;
    line-height: 22px;
    letter-spacing: 0%;
    text-align: center;
    opacity: 0.5;
`;
