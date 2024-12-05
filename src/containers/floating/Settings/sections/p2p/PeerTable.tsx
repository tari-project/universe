import { Table, Cell, TableRow, TableOverflowWrapper } from './P2PoolStats.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { timeAgo } from '@app/utils/getTimeAgo.ts';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { ConnectedPeerInfoExtended } from '@app/containers/floating/Settings/sections/p2p/P2PoolStats.tsx';

const headings = ['#', 'Peer ID', 'RandomX Height', 'SHA3X Height', 'Last Ping'];

export default function PeerTable({ peers }: { peers: ConnectedPeerInfoExtended[] }) {
    const headingMarkup = headings.map((heading, idx) => {
        const alignment = idx === 1 ? 'start' : 'end';
        return (
            <Cell key={heading} $alignment={alignment}>
                <Typography variant="h6">{heading}</Typography>
            </Cell>
        );
    });
    const peerMarkup = peers.map(({ peer_id, peer_info, last_ping, sha3WithinRange, randomxWithinRange }, idx) => {
        const count = idx + 1;
        const displayId = truncateMiddle(peer_id, 9);
        const { current_sha3x_height: sha3x_height, current_random_x_height: random_x_height } = peer_info || {};

        return (
            <TableRow key={peer_id} $altBg={idx % 2 === 0}>
                <Cell $alignment="end">
                    <Typography variant="p">{`${count}.`}</Typography>
                </Cell>
                <Cell $alignment="start" title={peer_id}>
                    {displayId}
                </Cell>
                <Cell>{random_x_height ? `${random_x_height} | ${randomxWithinRange ? '☺' : ':('}` : '-'}</Cell>
                <Cell>{sha3x_height ? `${sha3x_height} | ${sha3WithinRange ? '☺' : ':('}` : '-'}</Cell>
                <Cell>{last_ping ? timeAgo(+last_ping) : '-'}</Cell>
            </TableRow>
        );
    });
    return (
        <Table>
            <TableRow $isHeadingRow>{headingMarkup}</TableRow>
            <TableOverflowWrapper>{peerMarkup}</TableOverflowWrapper>
        </Table>
    );
}
