import { Table, Cell, TableRow } from './P2PoolStats.styles.ts';
import { ConnectedPeerInfo } from '@app/types/app-status.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { timeAgo } from '@app/utils/getTimeAgo.ts';
import { truncateMiddle } from '@app/utils/truncateString.ts';

const headings = ['#', 'Peer ID', 'RandomX Height', 'SHA3X Height', 'Last Ping'];

export default function PeerTable({ peers }: { peers: ConnectedPeerInfo[] }) {
    const headingMarkup = headings.map((heading, idx) => {
        const alignment = idx === 1 ? 'start' : 'end';
        return (
            <Cell key={heading} $alignment={alignment}>
                <Typography variant="h6">{heading}</Typography>
            </Cell>
        );
    });
    const peerMarkup = peers.map(({ peer_id, peer_info, last_ping }, idx) => {
        const count = idx + 1;
        const displayId = truncateMiddle(peer_id, 9);
        return (
            <TableRow key={peer_id} $altBg={idx % 2 === 0}>
                <Cell $alignment="end">{`${count}.`}</Cell>
                <Cell $alignment="start" title={peer_id}>
                    {displayId}
                </Cell>
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