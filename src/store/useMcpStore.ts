import { create } from 'zustand';

export interface McpAuditEntry {
    timestamp: string;
    tool_name: string;
    tier: string;
    status: 'Started' | 'Success' | 'Error' | 'Denied' | 'RateLimited';
    duration_ms?: number;
    client_info?: string;
    details?: string;
}

export interface McpPendingTransaction {
    request_id: string;
    destination: string;
    amount_micro_minotari: number;
    amount_display: string;
}

interface McpStoreState {
    serverRunning: boolean;
    serverPort: number | null;
    auditEntries: McpAuditEntry[];
    pendingTransaction: McpPendingTransaction | null;
}

const initialState: McpStoreState = {
    serverRunning: false,
    serverPort: null,
    auditEntries: [],
    pendingTransaction: null,
};

export const useMcpStore = create<McpStoreState>()(() => ({
    ...initialState,
}));

export const setMcpServerStatus = (running: boolean, port: number | null) => {
    useMcpStore.setState({ serverRunning: running, serverPort: port });
};

export const addMcpAuditEntry = (entry: McpAuditEntry) => {
    useMcpStore.setState((state) => ({
        auditEntries: [entry, ...state.auditEntries].slice(0, 500),
    }));
};

export const setMcpPendingTransaction = (transaction: McpPendingTransaction | null) => {
    useMcpStore.setState({ pendingTransaction: transaction });
};
