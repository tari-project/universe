import { create } from 'zustand';
import { addToast } from '@app/components/ToastStack/useToastStore';

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

export type McpTxStatus = 'reviewing' | 'processing' | 'completed';

interface McpStoreState {
    serverRunning: boolean;
    serverPort: number | null;
    auditEntries: McpAuditEntry[];
    pendingTransaction: McpPendingTransaction | null;
    mcpTxStatus: McpTxStatus;
}

const initialState: McpStoreState = {
    serverRunning: false,
    serverPort: null,
    auditEntries: [],
    pendingTransaction: null,
    mcpTxStatus: 'reviewing',
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
    useMcpStore.setState({ pendingTransaction: transaction, mcpTxStatus: transaction ? 'reviewing' : 'reviewing' });
};

export const setMcpTxStatus = (status: McpTxStatus) => {
    useMcpStore.setState({ mcpTxStatus: status });
};

let lastHandledRequestId: string | null = null;

export const handleMcpTransactionResult = (payload: { request_id: string; success: boolean; error?: string }) => {
    if (payload.request_id === lastHandledRequestId) return;
    lastHandledRequestId = payload.request_id;

    if (payload.success) {
        setMcpTxStatus('completed');
        addToast({ title: 'MCP Transaction Sent', type: 'success' });
    } else {
        setMcpPendingTransaction(null);
        addToast({ title: 'MCP Transaction Failed', text: payload.error ?? 'Unknown error', type: 'error' });
    }
};
