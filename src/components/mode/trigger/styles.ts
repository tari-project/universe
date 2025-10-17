import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Variant } from '../types.ts';

interface Props {
    $variant?: Variant;
    $isOpen?: boolean;
    $selectedMode?: string;
}

export const TriggerCTA = styled.button<Props>`
    display: flex;
    flex: 1 1 auto;
    position: relative;
    //width: 100%;
    //align-items: center;
    justify-content: space-between;
`;

export const TriggerContent = styled.div<Props>`
    flex: 1 1 auto;
    height: 45px;
    padding: 9px 15px;
    border-radius: 70px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(240, 241, 240, 0.75);
    backdrop-filter: blur(5px);
    color: #000;
    transition: background 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    &:hover {
        background: rgba(240, 241, 240, 1);
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            background: rgba(240, 241, 240, 1);
        `}
`;

export const Content = styled.div<Props>`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const Label = styled(Typography)<Props>`
    color: #797979;
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
`;

export const SelectedItem = styled.div<Props>`
    display: flex;
    color: ${({ theme, $variant }) => ($variant === 'secondary' ? theme.palette.text.primary : '#000')};
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-weight: 600;
    align-items: center;
    gap: 5px;

    .option-icon {
        width: auto;
        height: 16px;
    }
`;

export const IconWrapper = styled.div<Props>`
    transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    transform-origin: center;

    display: flex;
    align-items: center;
    justify-content: center;

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: scaleY(-1);
        `}
`;

export const SecondaryTriggerContent = styled.div<Props>`
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    z-index: 1;
    border-radius: 10px;
    background:
        radial-gradient(ellipse at -10% 150%, #a5b938 -25%, transparent 65%),
        radial-gradient(ellipse at 90% 120%, #ffebaba3 -45%, transparent 60%) #4e7a4a;
    padding: 10px 15px;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(5px);
    justify-content: space-between;
    color: #fff;

    ${Content} {
        flex: 1 1 auto;
    }
    ${Label} {
        color: #fff;
        opacity: 0.75;
        font-size: 12px;
        line-height: 1.2;
    }

    ${SelectedItem} {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            background: rgba(240, 241, 240, 1);
        `};

    ${({ $selectedMode }) => {
        switch ($selectedMode) {
            case 'Ludicrous':
                return css`
                    background:
                        radial-gradient(ellipse at -10% 150%, #ff6100 -25%, transparent 65%),
                        radial-gradient(ellipse at 90% 120%, rgba(243, 177, 110, 0.66) -45%, transparent 60%) #77341f;
                `;

            case 'Custom':
                return css`
                    background:
                        radial-gradient(ellipse at -10% 150%, #397fb9 -25%, transparent 65%),
                        radial-gradient(ellipse at 90% 120%, rgba(138, 194, 239, 0.79) -45%, transparent 60%) #123959;
                `;
            case 'Turbo':
                return css`
                    background:
                        radial-gradient(ellipse at -10% 150%, #4a7a60 -25%, transparent 65%),
                        radial-gradient(ellipse at 90% 120%, rgba(157, 255, 177, 0.41) -45%, transparent 60%) #154349;
                `;
            case 'Eco':
            default:
                return css`
                    background:
                        radial-gradient(ellipse at -10% 150%, rgba(165, 185, 56, 0.89) -25%, transparent 65%),
                        radial-gradient(ellipse at 90% 120%, rgba(255, 235, 171, 0.55) -45%, transparent 60%) #4e7a4a;
                `;
        }
    }}
`;
