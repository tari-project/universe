import BlockInfo from './components/BlockInfo';
import BlockTime from './components/BlockTime';
import TopStatus from './components/TopStatus';

import { InfoContainer } from '../styles';
import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';
import { MiningViewContainer } from './MiningView.styles.ts';

function MiningView() {
    return (
        <MiningViewContainer>
            <InfoContainer>
                <TopStatus />
                <BlockInfo />
            </InfoContainer>
            <Earnings />
            <InfoContainer>
                <div />
                <BlockTime />
            </InfoContainer>
        </MiningViewContainer>
    );
}

export default MiningView;
