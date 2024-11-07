import { convertHexToRGBA } from '@app/utils/convertHex';
import { m } from 'framer-motion';
import styled, { css } from 'styled-components';

const Wrapper = styled.div<{ $variant?: 'primary' | 'small' | 'tiny' }>`
    width: 100%;
    background: ${({ theme, $variant }) =>
        $variant !== 'primary' ? convertHexToRGBA(theme.palette.contrast, 0.1) : theme.palette.base};

    border-radius: 20px;
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

const Bar = styled(m.div)<{ $variant?: 'primary' | 'small' | 'tiny' }>`
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.contrast};
    height: ${({ $variant }) => ($variant ? '5px' : '10px')};
`;

export function LinearProgress({
    value = 10,
    variant = 'primary',
}: {
    value?: number;
    variant?: 'primary' | 'small' | 'tiny';
}) {
    return (
        <Wrapper $variant={variant}>
            <Bar initial={{ width: 0 }} animate={{ width: `${value}%` }} $variant={variant} />
        </Wrapper>
    );
}
