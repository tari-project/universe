import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $canClaim: boolean; $isClaimed: boolean }>`
    display: flex;
    align-items: center;
    align-self: stretch;
    gap: 14px;

    height: 70px;
    padding: 12px;

    border-radius: 15px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%);

    position: relative;
    overflow: hidden;

    ${({ $canClaim, $isClaimed }) =>
        $canClaim &&
        !$isClaimed &&
        css`
            border: 1px solid #00a505;
            background: linear-gradient(180deg, rgba(164, 255, 159, 0.3) 0%, rgba(190, 255, 167, 0.21) 100%);
        `}
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
`;

export const TopRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

export const Username = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.924px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 185px;
`;
