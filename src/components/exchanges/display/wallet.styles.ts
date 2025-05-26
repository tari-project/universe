import styled from 'styled-components';
import * as m from 'motion/react-m';

export const WalletDisplayWrapper = styled.div`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: 20px;
    padding: 15px 15px 0 15px;
    display: flex;
    flex-direction: column;
`;

export const XCInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
`;
export const HeaderSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const AddressWrapper = styled(m.div)<{ $isOpen: boolean }>`
    overflow: hidden;
`;

export const AddressDisplay = styled.div`
    border-radius: 24px;
    font-weight: 900;
    white-space: nowrap;
    background-color: ${({ theme }) => theme.palette.background.default};
    letter-spacing: 0.1rem;
    padding: 10px 0;
    margin: 10px 0 15px;
    align-items: center;
    justify-content: center;
    display: flex;
`;
