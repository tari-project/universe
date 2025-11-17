import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    display: flex;
    width: 100%;
    overflow: hidden;
`;

export const SecureWalletWarningButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;

    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: rgba(255, 255, 255, 0.04);

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    @media (max-height: 652px) {
        padding: 4px 6px;
    }
`;

export const LeftTextGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const SecureIcon = styled.span`
    font-size: 9px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 100px;
    background: #fff;
    color: #000;
`;

export const StepsWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const StepsDots = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const StepsDot = styled.div<{ $isActive: boolean }>`
    width: 6px;
    height: 6px;
    border-radius: 100px;
    background: ${({ $isActive }) => ($isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)')};
`;

export const StepsText = styled.span`
    font-size: 10px;
    color: #fff;
    opacity: 0.5;
`;
