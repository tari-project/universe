import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography';
import type { McpPortError } from '@app/store/useMcpStore';

const ErrorText = styled(Typography)`
    color: ${({ theme }) => theme.palette.error.main};
    word-break: break-word;
`;

interface Props {
    error: McpPortError | null;
    testId?: string;
}

/**
 * Inline feedback for the MCP server port. Shared by the port field and the server toggle so both
 * paths that can hit a bind failure explain it the same way.
 */
export default function PortErrorMessage({ error, testId = 'mcp-port-error' }: Props) {
    const { t } = useTranslation(['settings'], { useSuspense: false });

    if (!error) return null;

    let text: string;
    switch (error.kind) {
        case 'invalid':
            text = t('mcp.advanced.port-invalid');
            break;
        case 'out-of-range':
            text = t('mcp.advanced.port-out-of-range');
            break;
        case 'in-use':
            text = t('mcp.advanced.port-in-use', { port: error.port });
            break;
        case 'unknown':
            text = t('mcp.advanced.port-unknown-error', { message: error.message });
            break;
    }

    return (
        <ErrorText variant="p" role="alert" data-testid={testId}>
            {text}
        </ErrorText>
    );
}
