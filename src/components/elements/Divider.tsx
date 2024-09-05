import { HTMLAttributes } from 'react';
import styled from 'styled-components';

type DividerProps = HTMLAttributes<HTMLHRElement>;

const StyledDivider = styled.hr<DividerProps>`
    display: flex;
    width: 100%;
    border-color: ${({ theme }) => theme.palette.divider};
`;

export function Divider(props: DividerProps) {
    return <StyledDivider {...props} />;
}
