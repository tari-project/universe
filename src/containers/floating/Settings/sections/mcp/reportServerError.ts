import { useMcpStore } from '@app/store/useMcpStore';

export function reportServerError(error: unknown, port: number) {
    const conflict = String(error).match(/MCP_PORT_IN_USE:(\d+):/);
    useMcpStore.setState({
        serverError: {
            key: conflict ? 'port-in-use' : 'start-failed',
            port: conflict ? Number(conflict[1]) : port,
        },
    });
}
