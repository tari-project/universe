import { m } from 'framer-motion';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    height: 8px;
    border-radius: 20px;
    overflow: hidden;
    align-items: center;
    display: flex;
`;

const Bar = styled(m.div)<{ $isSecondary?: boolean }>`
    border-radius: 20px;
    background: ${({ theme, $isSecondary }) => ($isSecondary ? theme.palette.contrast : theme.palette.success.main)};
    height: 8px;
`;

export function LinearProgress({
    value = 10,
    variant = 'primary',
}: {
    value?: number;
    variant?: 'primary' | 'secondary';
}) {
    return (
        <Wrapper>
            <Bar
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                $isSecondary={Boolean(variant == 'secondary')}
            />
        </Wrapper>
    );
}
