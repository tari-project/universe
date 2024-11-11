import { m } from 'framer-motion';
import { css, styled } from 'styled-components';
import { ToastType } from '../useToastStore';

export const Wrapper = styled(m.div)<{ $isFirst?: boolean; $type: ToastType }>`
    position: absolute;
    bottom: 30px;
    padding: 12px 30px;
    border-radius: 100px;
    pointer-events: ${({ $isFirst }) => ($isFirst ? 'all' : 'none')};
    cursor: pointer;

    color: #fff;
    font-size: 16px;
    font-weight: 500;

    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.035),
        0 4px 8px rgba(0, 0, 0, 0.035),
        0 8px 16px rgba(0, 0, 0, 0.06),
        0 16px 32px rgba(0, 0, 0, 0.075);

    ${({ $type }) => {
        switch ($type) {
            case 'error':
                return css`
                    background: linear-gradient(-45deg, #dc2626 0%, #ef4444 100%);
                `;
            case 'warning':
                return css`
                    background: linear-gradient(-45deg, #f59e0b 0%, #fbbf24 100%);
                `;
            case 'success':
                return css`
                    background: linear-gradient(-45deg, #10b981 0%, #34d399 100%);
                `;
            default:
                return css`
                    background: #fff;
                    color: #000;
                `;
        }
    }}
`;
