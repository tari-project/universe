import { convertHexToRGBA } from '@app/utils/convertHex';
import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

const Wrapper = styled.div<{ $variant?: 'primary' | 'small' | 'tiny' }>`
    width: 100%;
    background: ${({ theme, $variant }) =>
        $variant !== 'primary' ? convertHexToRGBA(theme.palette.contrast, 0.1) : theme.palette.base};
    border-radius: 50px;
    overflow: hidden;
    align-items: center;
    display: flex;
    ${({ $variant }) => {
        switch ($variant) {
            case 'tiny': {
                return css`
                    padding: 0;
                    height: 4px;
                `;
            }
            case 'small': {
                return css`
                    padding: 0;
                    height: 5px;
                `;
            }
            case 'primary':
            default: {
                return css`
                    padding: 5px;
                    height: 20px;
                `;
            }
        }
    }};
`;

const BarSVG = styled.svg`
    width: 100%;
    height: 100%;
    border-radius: 50px;
`;
const BarLine = styled(m.line)<{ $variant?: 'primary' | 'small' | 'tiny' }>`
    stroke-width: ${({ $variant }) => ($variant ? '5px' : '10px')};
    stroke: ${({ theme }) => theme.palette.contrast};
`;

export function LinearProgress({
    value = 0,
    variant = 'primary',
    duration,
    onAnimationComplete,
}: {
    value?: number;
    variant?: 'primary' | 'small' | 'tiny';
    duration?: number;
    onAnimationComplete?: () => void;
}) {
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
            </BarSVG>
        </Wrapper>
    );
}
