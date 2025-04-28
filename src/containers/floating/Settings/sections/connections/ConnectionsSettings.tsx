import Node from './Node.tsx';
import Network from './Network.tsx';
import Peers from './Peers.tsx';
import NodeTypeConfiguration from './NodeTypeConfiguration.tsx';

export const ConnectionsSettings = () => {
    return (
        <>
            {import.meta.env.MODE == 'development' && <NodeTypeConfiguration />}
            <Node />
            <Network />
            <Peers />
        </>
    );
};
