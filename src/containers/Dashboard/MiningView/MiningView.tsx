import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';

import { InfoContainer } from '../styles';
import { useVisualisation } from '@app/hooks/useVisualisation.ts';

function MiningView() {
    const { handlePause, handleStart, handleFail } = useVisualisation();
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <button onClick={handleStart}>start</button>
                <button onClick={handleFail}>fail</button>
                <button onClick={handlePause}>pause</button>
                <BlockInfo />
            </InfoContainer>
            <VisualMode />
        </>
    );
}

export default MiningView;
