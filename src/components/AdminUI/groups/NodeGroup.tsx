/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { NodeType, useNodeStore } from '@app/store/useNodeStore.ts';
import { invoke } from '@tauri-apps/api/core';

export function NodeGroup() {
    const node_type = useNodeStore((s) => s.node_type);

    function handleChangeNode(nodeType: NodeType) {
        invoke('set_node_type', { nodeType }).then(console.debug).catch(console.error);
    }

    return (
        <>
            <CategoryLabel>Theme</CategoryLabel>
            <ButtonGroup>
                <Button $isActive={node_type === 'Local'} onClick={() => handleChangeNode('Local')}>
                    Local
                </Button>
                <Button $isActive={node_type === 'Remote'} onClick={() => handleChangeNode('Remote')}>
                    Remote
                </Button>
                <Button
                    $isActive={node_type === 'RemoteUntilLocal'}
                    onClick={() => handleChangeNode('RemoteUntilLocal')}
                >
                    RemoteUntilLocal
                </Button>
                <Button
                    $isActive={node_type === 'LocalAfterRemote'}
                    onClick={() => handleChangeNode('LocalAfterRemote')}
                >
                    LocalAfterRemote
                </Button>
            </ButtonGroup>
        </>
    );
}
