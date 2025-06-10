import styled, { css } from 'styled-components';
import { SwapDirection as SwapDirectionType } from '@app/hooks/swap/lib/types';

export const WalletConnectHeader = styled.div`
    margin-bottom: 20px;
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 21px;
    line-height: 31px;
    color: ${({ theme }) => theme.palette.text.primary};
    padding-left: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const SelectedChain = styled.div`
    margin-top: 20px;
    display: flex;
    padding: 10px 16px;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    border-radius: 12px;
    background: ${({ theme }) => theme.palette.background.main};
`;

export const SelectedChainInfo = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;

    .chain {
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: 0%;
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    .address {
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 13px;
        line-height: 100%;
        letter-spacing: 0%;
        text-align: center;
    }
`;

export const SwapOption = styled.div`
    width: 100%;
    margin-top: 5px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: ${({ theme }) => theme.palette.background.main};
    border-radius: 15px;

    > span {
        color: ${({ theme }) => theme.palette.text.secondary};
        font-size: 10px;
    }
`;

export const SwapOptionAmount = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 36px;
    line-height: 117%;
    letter-spacing: -1.61px;
`;

export const SwapOptionCurrency = styled.div`
    border-radius: 60px;
    gap: 6px;
    padding: 5px;
    padding-right: 10px;
    background: ${({ theme }) => theme.palette.background.paper};
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

    span {
        color: ${({ theme }) => theme.palette.text.primary};
        font-family: Alliance No.1;
        font-weight: 700;
        font-size: 12.85px;
        line-height: 100%;
        letter-spacing: -2%;
    }
`;

export const SwapDirection = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1px;
    z-index: 2;
`;

export const SwapAmountInput = styled.input<{ $error?: boolean }>`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 28px;
    line-height: 100%;
    letter-spacing: -1px;
    width: 100%;
    background: transparent;
    border: none;
    text-align: left;
    padding: 0;
    margin-right: 10px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    ${({ $error }) =>
        $error &&
        css`
            color: ${({ theme }) => theme.palette.error.main};
        `}
`;

export const SwapDirectionWrapper = styled.div<{ $direction: SwapDirectionType }>`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.secondary};
    border: 4px solid ${({ theme }) => theme.palette.divider};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;

    svg {
        transition: transform 0.2s ease-in-out;
    }

    ${({ $direction }) =>
        $direction === 'fromXtm' &&
        css`
            svg {
                transform: rotate(180deg);
            }
        `}
`;

export const SwapDetails = styled.div`
    margin-top: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
`;

// export const SwapDetailsKey = styled.div`
//     color: rgba(0, 0, 0, 0.6);
//     font-family: Poppins, sans-serif;
//     font-weight: 500;
//     font-size: 11px;
//     line-height: 130%;
//     letter-spacing: -2%;
//     display: flex;
//     align-items: center;
//     gap: 8px;
// `;

// export const SwapDetailsValue = styled.div`
//     color: black;
//     font-family: Poppins, sans-serif;
//     font-weight: 500;
//     font-size: 14px;
//     line-height: 117%;
//     letter-spacing: -3%;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//
//     span {
//         font-family: Poppins, sans-serif;
//         font-weight: 500;
//         font-size: 10px;
//         line-height: 100%;
//         letter-spacing: -3%;
//     }
// `;

// export const NewOutputWrapper = styled.div`
//     border: 2px solid #0000001a;
//     border-radius: 10px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 13px 15px;
//     margin-bottom: 20px;
// `;

// export const NewOutputAmount = styled.div`
//     display: flex;
//     flex-direction: column;
//     gap: 4px;
// `;

// export const PoweredBy = styled.div`
//     color: #7f8599;
//     padding: 20px 20px 0 20px;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     gap: 5px;
//
//     font-family: Poppins, sans-serif;
//     font-weight: 500;
//     font-size: 12px;
// `;
