import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

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

const BarSVG = styled.svg`
    width: 100%;
    height: 100%;
    border-radius: 52px;
`;
const BarLine = styled(m.line)<{ $variant?: LinearProgressVariant }>`
    stroke-width: ${({ $variant }) => ($variant === 'small' ? '5px' : '10px')};
    stroke: ${({ theme }) => `url(${theme.mode === 'dark' ? '#bar_gradient_dark' : '#bar_gradient_light'})`};
    color: rgba(13, 24, 32, 0.7);
`;

interface LinearProgressProps {
    value?: number;
    variant?: LinearProgressVariant;
    duration?: number;
    onAnimationComplete?: () => void;
}
export function LinearProgress({ value = 0, variant = 'small', duration, onAnimationComplete }: LinearProgressProps) {
    return (
        <Wrapper $variant={variant}>
            <BarSVG strokeLinecap="round">
                <BarLine
                    x1="0%"
                    y1="50%"
                    y2="50%"
                    fill="transparent"
                    strokeLinecap="round"
                    $variant={variant}
                    initial={{ x2: '0%' }}
                    animate={{ x2: `${value}%` }}
                    transition={{ duration: duration || 0.5, ease: 'linear' }}
                    onAnimationComplete={onAnimationComplete}
                />
                <defs>
                    <linearGradient
                        id="bar_gradient_light"
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="100%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor="#8DBCF95f" />
                        <stop offset="15%" stopColor="#071E6B" />
                        <stop offset="50%" stopColor="#0D1820" />
                        <stop offset="85%" stopColor="#071E6B" />
                        <stop offset="100%" stopColor="#8DBCF95f" />
                    </linearGradient>
                    <linearGradient
                        id="bar_gradient_dark"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor="#0D1820B3" />
                        <stop offset="15%" stopColor="#0D1820" />
                        <stop offset="50%" stopColor="#8DBCF950" />
                        <stop offset="85%" stopColor="#0D1820" />
                        <stop offset="100%" stopColor="#0D1820B3" />
                    </linearGradient>
                </defs>
            </BarSVG>
        </Wrapper>
    );
}
