import styled from 'styled-components';

export const ConnectionIcon = styled.div<{ $isConnected?: boolean }>(({ theme, $isConnected }) => ({
    color: $isConnected ? theme.palette.success.main : theme.palette.error.main,
    display: 'flex',
}));
