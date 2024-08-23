import BlockTime from './components/BlockTime';
import BlockHeight from './components/BlockHeight.tsx';
import TopStatus from './components/TopStatus';

import { InfoContainer } from '../styles';
import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';
import { MiningViewContainer } from './MiningView.styles.ts';

function MiningView() {
    return (
        <MiningViewContainer>
            <InfoContainer>
                <TopStatus />
            </InfoContainer>
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
