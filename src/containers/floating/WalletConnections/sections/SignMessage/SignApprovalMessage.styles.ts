import styled from 'styled-components';

export const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;

    h3 {
        font-family: Poppins;
        font-weight: 600;
        font-size: 21px;
        line-height: 31px;
        letter-spacing: 0%;
        text-align: center;
        color: black;
        max-width: 300px;
        margin: 0;
    }

    p {
        font-family: Poppins;
        font-weight: 500;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0.46px;
        text-align: center;
        color: #090719;
        max-width: 420px;
        margin: 0;
    }
`;

export const StatusWrapper = styled.div`
    margin: 20px auto;
    width: fit-content;
    background: white;
    border-radius: 60px;
    padding-top: 10px;
    padding-right: 20px;
    padding-bottom: 10px;
    padding-left: 20px;
    gap: 15px;

    display: flex;
    align-items: center;

    font-family: Poppins;
    font-weight: 500;
    font-size: 14px;
    color: black;
`;

export const LoadingDots = styled.span`
    color: currentColor;
    display: inline-block;
    width: 24px;
    text-align: left;

    &::after {
        content: '';
        animation: dots 1.5s steps(5, end) infinite;
    }

    @keyframes dots {
        0%,
        20% {
            content: '';
        }
        40% {
            content: '.';
        }
        60% {
            content: '..';
        }
        80%,
        100% {
            content: '...';
        }
    }
`;
