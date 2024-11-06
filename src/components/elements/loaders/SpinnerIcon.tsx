import styled, { keyframes } from 'styled-components';
import { ImSpinner3 } from 'react-icons/im';

const spin = keyframes`
  from {
  transform:rotate(0deg)
  }
  to {
  transform:rotate(360deg)
  }
`;
const StyledIcon = styled(ImSpinner3)`
    animation: ${spin} 2s infinite;
    animation-timing-function: cubic-bezier(0.76, 0.89, 0.95, 0.85);
`;

export function SpinnerIcon() {
    return <StyledIcon />;
}
