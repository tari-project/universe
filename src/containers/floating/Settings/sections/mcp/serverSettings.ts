import { invoke } from '@tauri-apps/api/core';
import { useMcpStore } from '@app/store/useMcpStore';

type SettingsChange =
    | { command: 'set_mcp_port'; args: { port: number } }
    | {
          command: 'set_mcp_enabled';
          args: { enabled: boolean };
      };

// Both controls affect the same listener. In particular, Enter followed by blur
// must not start two overlapping restarts or overwrite a newer error.
export async function updateServerSettings(change: SettingsChange) {
    if (useMcpStore.getState().settingsPending) return;
    useMcpStore.setState({ settingsPending: true, settingsError: null });
    try {
        await invoke(change.command, change.args);
        useMcpStore.setState({ settingsError: null });
    } catch (error) {
        console.error('Failed to update MCP server settings:', error);
        // Only AddrInUse gets this message from the backend. Permission errors,
        // config write failures, etc. must not be called port conflicts.
        const conflict = typeof error === 'string' && /^MCP server port (\d+) is already in use:/.exec(error);
        useMcpStore.setState({
            settingsError: conflict ? { kind: 'port-in-use', port: Number(conflict[1]) } : { kind: 'update-failed' },
        });
    } finally {
        useMcpStore.setState({ settingsPending: false });
    }
}
