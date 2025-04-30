import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: clamp(10vh, 400px, 45vh);
`;

export const BuyTariButton = styled.button`
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border-radius: 72px;
    background: #188750;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
        opacity: 0.9;
    }

    font-family: Poppins;
    font-weight: 600;
    font-size: 13px;
    line-height: 100%;
    text-align: center;
`;
