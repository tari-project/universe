import styled from 'styled-components';

export const ClaimButton = styled.button`
    border-radius: 100px;
    background: #00a505;
    box-shadow: 0px 0px 14px 0px rgba(113, 255, 69, 0.5);

    display: flex;
    justify-content: center;
    align-items: center;

    height: 20px;
    padding: 0px 8px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.2px;
    white-space: nowrap;

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: #008505;
    }
`;

export const NudgeButton = styled.button`
    border-radius: 100px;
    background: #ff720e;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;

    height: 20px;
    padding: 0px 5px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    white-space: nowrap;

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: #d9600c;
    }
`;

export const TimePill = styled.div`
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.1);

    display: flex;
    justify-content: center;
    align-items: center;

    height: 20px;
    padding: 0px 8px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.2px;
    white-space: nowrap;

    span {
        color: rgba(255, 255, 255, 0.5);
        font-weight: 500;
    }
`;
