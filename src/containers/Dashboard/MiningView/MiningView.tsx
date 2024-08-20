import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';

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
            <VisualMode />
        </MiningViewContainer>
    );
}

export default MiningView;
