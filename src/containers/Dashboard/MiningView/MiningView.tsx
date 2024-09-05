import BlockTime from './components/BlockTime';
import BlockHeight from './components/BlockHeight.tsx';

import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';

import { MiningViewContainer } from './MiningView.styles.ts';

export default function MiningView() {
    return (
        <MiningViewContainer>
            <BlockHeight />
            <Earnings />
            <BlockTime />
        </MiningViewContainer>
    );
}
