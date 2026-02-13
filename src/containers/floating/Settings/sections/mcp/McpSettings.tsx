import ServerToggle from './ServerToggle';
import TokenDisplay from './TokenDisplay';
import AgentConfig from './AgentConfig';
import TransactionSettings from './TransactionSettings';
import AuditLog from './AuditLog';
import AdvancedSettings from './AdvancedSettings';

export const McpSettings = () => {
    return (
        <>
            <ServerToggle />
            <TokenDisplay />
            <AgentConfig />
            <TransactionSettings />
            <AuditLog />
            <AdvancedSettings />
        </>
    );
};
