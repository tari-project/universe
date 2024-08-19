import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';

import { InfoContainer } from '../styles';

function MiningView() {
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <BlockInfo />
            </InfoContainer>
            <VisualMode />
        </>
    );
}

export default MiningView;
