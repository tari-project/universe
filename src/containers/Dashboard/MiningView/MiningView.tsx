import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';
import MiningButton from './components/MiningButton';
import { InfoContainer } from '../styles';

function MiningView() {
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <BlockInfo />
            </InfoContainer>
            <VisualMode />
            <MiningButton />
        </>
    );
}

export default MiningView;
