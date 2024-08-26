import BlockTime from './components/BlockTime';
import BlockHeight from './components/BlockHeight.tsx';

import { InfoContainer } from '../styles';
import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';
import { MiningViewContainer } from './MiningView.styles.ts';

function MiningView() {
    return (
        <MiningViewContainer>
            <Earnings />
            <BlockHeight />
            <InfoContainer>
                <div />
                <BlockTime />
            </InfoContainer>
        </MiningViewContainer>
    );
}

export default MiningView;
