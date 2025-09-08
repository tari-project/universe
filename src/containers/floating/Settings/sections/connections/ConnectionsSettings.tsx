import Node from './Node.tsx';
import Network from './Network.tsx';
import Peers from './Peers.tsx';
import NodeTypeConfiguration from './NodeTypeConfiguration.tsx';
import { LocalNodeSync } from '@app/components/sync/LocalNodeSync.tsx';
import { useNodeStore } from '@app/store/useNodeStore.ts';

export const ConnectionsSettings = () => {
    const nodeType = useNodeStore((s) => s.node_type);
    return (
        <>
            {nodeType != 'Remote' && <LocalNodeSync />}
            <NodeTypeConfiguration />
            <Node />
            <Network />
            <Peers />
        </>
    );
};
