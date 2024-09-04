import BlockTime from './components/BlockTime';
import BlockHeight from './components/BlockHeight.tsx';

import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';
import { MiningViewContainer } from './MiningView.styles.ts';

function MiningView() {
    return (
        <MiningViewContainer>
            <Earnings />
            <BlockHeight />
            <BlockTime />
        </MiningViewContainer>
    );
}

export default MiningView;
