import styled from 'styled-components';

export const SelectedChain = styled.div`
    margin-top: 20px;
    display: flex;
    padding: 10px 16px;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5);
`;

export const SelectedChainInfo = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;

    .chain {
        font-family: Poppins;
        font-weight: 600;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: 0%;
        color: #7f7e7d;
    }

    .address {
        font-family: Poppins;
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
    background: rgba(255, 255, 255, 0.8);
    border-radius: 15px;

    > span {
        color: #7f7e7d;
        font-size: 10px;
    }
`;

export const SwapOptionAmount = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    color: black;
    font-family: Poppins;
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
    background: #e5e2e1;
    display: flex;
    align-items: center;

    span {
        color: black;
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

export const SwapAmountInput = styled.input`
    color: black;
    font-family: Alliance No.1;
    font-weight: 700;
    font-size: 12.85px;
    line-height: 100%;
    letter-spacing: -2%;
    width: 100%;
    &:focus {
        outline: none;
    }
`;

export const SwapDirectionWrapper = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    padding: 5px 0 0 8px;
    background: black;
    border: 4px solid #e5e2e1;
`;

export const SwapDetails = styled.div`
    margin-top: 20px;
    display: flex;
    flex-direction: column;
`;

export const SwapDetailsItemWrapper = styled.div`
    border-top: 2px solid #0000001a;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 15px 0;
`;

export const SwapDetailsKey = styled.div`
    color: rgba(0, 0, 0, 0.6);
    font-family: Poppins;
    font-weight: 500;
    font-size: 11px;
    line-height: 130%;
    letter-spacing: -2%;
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const SwapDetailsValue = styled.div`
    color: black;
    font-family: Poppins;
    font-weight: 500;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
    display: flex;
    justify-content: space-between;
    span {
        font-family: Poppins;
        font-weight: 500;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: -3%;
    }
`;

export const NewOutputWrapper = styled.div`
    border: 2px solid #0000001a;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 15px;
    margin-bottom: 20px;
`;

export const NewOutputAmount = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const PoweredBy = styled.div`
    color: #7f8599;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;

    font-family: Poppins;
    font-weight: 500;
    font-size: 12px;
`;
