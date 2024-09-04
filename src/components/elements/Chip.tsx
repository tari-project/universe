import { ReactNode } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    padding: 6px 14px;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    max-height: 20px;
    background: ${({ theme }) => theme.palette.contrast};

    span {
        color: ${({ theme }) => theme.palette.text.contrast};
        font-family: Poppins, sans-serif;
        font-size: 11px;
        font-weight: 600;
        user-select: none;
    }
`;
interface ChipProps {
    children: ReactNode;
}
export function Chip({ children }: ChipProps) {
    return (
        <Wrapper>
            <span>{children}</span>
        </Wrapper>
    );
}
