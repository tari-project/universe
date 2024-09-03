import BlockTime from './components/BlockTime';
import BlockHeight from './components/BlockHeight.tsx';

import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';

import { MiningViewContainer } from './MiningView.styles.ts';
import P2pool from '@app/containers/Dashboard/MiningView/components/P2pool.tsx';

export default function MiningView() {
    return (
        <MiningViewContainer>
            <P2pool />
            <Earnings />
            <BlockHeight />
            <BlockTime />
        </MiningViewContainer>
    );
}
