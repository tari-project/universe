import Node from './Node.tsx';
import Network from './Network.tsx';
import Peers from './Peers.tsx';
import NodeTypeConfiguration from './NodeTypeConfiguration.tsx';
import { Sync } from '@app/components/sync/Sync.tsx';

export const ConnectionsSettings = () => {
    return (
        <>
            <Sync />
            <NodeTypeConfiguration />
            <Node />
            <Network />
            <Peers />
        </>
    );
};
