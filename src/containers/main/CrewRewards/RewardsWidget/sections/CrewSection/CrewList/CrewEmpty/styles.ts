import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    padding: 20px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    align-self: stretch;

    border-radius: 15px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: rgba(255, 255, 255, 0.05);
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
`;

export const Title = styled.div`
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: normal;
    letter-spacing: -0.48px;
`;

export const Text = styled.div`
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 500;
    line-height: 115.385%;
    letter-spacing: -0.39px;
    text-align: center;

    max-width: 250px;

    strong {
        color: #fff;
        font-weight: 700;
    }
`;

export const Buttons = styled.div<{ $singleButton?: boolean }>`
    display: flex;
    gap: 5px;
    align-self: stretch;
    justify-content: stretch;

    > * {
        flex: 1;
    }

    ${({ $singleButton }) =>
        $singleButton &&
        css`
            justify-content: center;

            > * {
                max-width: 200px;
                flex: none;
            }
        `}
`;

export const ButtonOutline = styled.button`
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 190%;

    display: flex;
    height: 40px;
    padding: 4px 4px 4px 11px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    align-self: stretch;

    border-radius: 60px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;
