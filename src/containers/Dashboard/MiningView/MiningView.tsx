import BlockInfo from './components/BlockInfo';
import BlockTime from './components/BlockTime';
import TopStatus from './components/TopStatus';

import { InfoContainer } from '../styles';

function MiningView() {
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <BlockInfo />
            </InfoContainer>
            <BlockTime />
        </>
    );
}

export default MiningView;
