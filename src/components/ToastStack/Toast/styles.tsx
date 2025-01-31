import { m } from 'motion';
import { css, styled } from 'styled-components';
import { ToastType } from '../useToastStore';

export const Wrapper = styled(m.div)<{ $isFirst?: boolean; $type: ToastType }>`
    position: absolute;
    bottom: 33px;
    padding: 12px 64px 12px 30px;
    border-radius: 100px;
    pointer-events: ${({ $isFirst }) => ($isFirst ? 'all' : 'none')};

    color: #fff;
    font-size: 16px;
    font-weight: 500;

    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.07),
        0 4px 8px rgba(0, 0, 0, 0.07),
        0 8px 16px rgba(0, 0, 0, 0.12),
        0 16px 32px rgba(0, 0, 0, 0.15);

    will-change: transform, opacity;

    ${({ $type }) => {
        switch ($type) {
            case 'error':
                return css`
                    background: linear-gradient(45deg, #ef4444 0%, #dc2626 100%);
                `;
            case 'warning':
                return css`
                    background: linear-gradient(45deg, #f97316 0%, #fb923c 100%);
                `;
            case 'success':
                return css`
                    background: linear-gradient(45deg, #34d399 0%, #10b981 100%);
                `;
            default:
                return css`
                    background: #fff;
                    color: #000;
                `;
        }
    }}
`;

export const ProgressCircle = styled.svg<{ $progress: number; $type?: ToastType }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 30px;
    height: 30px;
    transform: rotate(-90deg);
    z-index: -1;

    transition: all 0.2s ease;
    opacity: 1;

    circle {
        transition: stroke-dashoffset 0.1s linear;
        stroke: ${({ $type }) => ($type && $type !== 'default' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)')};
        stroke-width: 2;
        fill: ${({ $type }) => ($type && $type !== 'default' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)')};
    }
`;

export const CloseButton = styled.button<{ $type?: ToastType }>`
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);

    width: 30px;
    height: 30px;

    color: ${({ $type }) => ($type && $type !== 'default' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')};
    font-size: 18px;
    margin-left: 16px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0;

    transition: all 0.2s ease;

    span {
        transition: transform 0.2s ease;
    }

    &:hover {
        background: ${({ $type }) =>
            $type && $type !== 'default' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'};

        span {
            transform: scale(1.25);
        }

        ${ProgressCircle} {
            opacity: 0;
        }
    }
`;

export const ToastContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
`;

export const Title = styled.div`
    font-weight: 500;
    font-size: 14px;
    line-height: 120%;
`;

export const Text = styled.div`
    font-size: 12px;
    opacity: 0.8;
    font-weight: 400;
    line-height: 120%;
`;
