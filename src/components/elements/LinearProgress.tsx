import * as m from 'motion/react-m';
import styled, { css, keyframes } from 'styled-components';

type LinearProgressVariant = 'small' | 'large';

const Wrapper = styled.div<{ $variant?: LinearProgressVariant }>`
    width: 100%;
    background: ${({ theme }) => theme.palette.base};
    border-radius: 50px;
    overflow: hidden;
    align-items: center;
    display: flex;
    ${({ $variant }) => {
        switch ($variant) {
            case 'large': {
                return css`
                    padding: 5px;
                    height: 20px;
                `;
            }
            case 'small':
            default: {
                return css`
                    padding: 0;
                    height: 5px;
                `;
            }
        }
    }};
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 200% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const ProgressBar = styled(m.div)<{ $width: number }>`
    width: ${({ $width }) => `${$width}%`};
    height: 100%;
    border-radius: 50px;
    overflow: hidden;
    background: ${({ theme }) =>
        theme.mode === 'light'
            ? 'linear-gradient(90deg, #001F6E 0%, #85A3D4 50%, #001F6E 100%)'
            : 'linear-gradient(90deg, #253659 0%, #435879 50%, #253659 100%)'};
    background-size: 200% 200%;
    animation: ${gradientAnimation} 3s linear infinite;
    will-change: width;
`;

interface LinearProgressProps {
    value?: number;
    variant?: LinearProgressVariant;
}

export function LinearProgress({ value = 0, variant = 'small' }: LinearProgressProps) {
    return (
        <Wrapper $variant={variant}>
            <ProgressBar
                animate={{ width: `${value}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                $width={value}
            />
        </Wrapper>
    );
}
