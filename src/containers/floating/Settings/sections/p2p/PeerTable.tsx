import { Table, Cell, TableRow } from './P2PoolStats.styles.ts';
import { ConnectedPeerInfo } from '@app/types/app-status.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { timeAgo } from '@app/utils/getTimeAgo.ts';

const headings = ['#', 'peer id', 'randomx height', 'sha3x height', 'last ping'];

export default function PeerTable({ peers }: { peers: ConnectedPeerInfo[] }) {
    const headingMarkup = headings.map((heading) => {
        const alignment = heading === '#' ? 'center' : heading === 'peer id' ? 'start' : 'end';
        return (
            <Cell key={heading} $alignment={alignment}>
                <Typography variant="h6">{heading}</Typography>
            </Cell>
        );
    });
    const peerMarkup = peers.map(({ peer_id, peer_info, last_ping }, idx) => {
        const count = idx + 1;
        return (
            <TableRow key={peer_id} $altBg={idx % 2 === 0}>
                <Cell $alignment="center">{count}</Cell>
                <Cell $alignment="start">{peer_id}</Cell>
                <Cell>{peer_info?.current_random_x_height || '-'}</Cell>
                <Cell>{peer_info?.current_sha3x_height || '-'}</Cell>
                <Cell>{last_ping ? timeAgo(+last_ping) : '-'}</Cell>
            </TableRow>
        );
    });
    return (
        <Table>
            <TableRow $isHeadingRow>{headingMarkup}</TableRow>
            {peerMarkup}
        </Table>
    );
}
