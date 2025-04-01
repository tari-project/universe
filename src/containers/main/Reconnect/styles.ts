import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const Wrapper = styled.div`
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

export const HeaderImg = styled.img`
    width: min(460px, 100vh);
    max-width: 100%;
`;

export const ButtonWrapper = styled.div`
    width: 406;
    height: 70;
    gap: 10px;
    border-radius: 50px;
    padding-top: 15px;
    padding-right: 30px;
    padding-bottom: 15px;
    padding-left: 30px;
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
`;

export const ConnectedButton = styled(Typography)`
    color: black;
    font-family: Poppins;
    font-weight: 600;
    font-size: 18px;
    line-height: 22px;
    letter-spacing: 0%;
    text-align: center;
    opacity: 0.5;
`;
