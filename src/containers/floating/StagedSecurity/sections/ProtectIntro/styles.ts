import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;

    padding-top: 60px;
`;

export const Warning = styled('div')`
    color: #000;
    font-size: 14px;
    font-weight: 600;

    border-radius: 100px;
    background: rgba(255, 107, 107, 0.25);

    display: flex;
    align-items: center;
    gap: 10px;

    height: 31px;
    padding: 0 12px;
`;

export const WalletText = styled('div')`
    color: #000;
    font-size: 18px;
    font-weight: 600;
    line-height: normal;

    border-radius: 100px;
    background: rgba(0, 0, 0, 0.1);

    padding: 0px 18px;
    height: 37px;

    display: flex;
    align-items: center;
    justify-content: center;

    span {
        text-transform: lowercase;
        margin: 0 4px;
    }
`;
