import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';

import { InfoContainer } from '../styles';
import { useVisualisation } from '@app/hooks/useVisualisation.ts';

function MiningView() {
    const { handlePause, handleStart, handleFail, handleRestart, handleStop } = useVisualisation();
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <button onClick={handleStart}>start</button>
                <button onClick={handleStop}>stop</button>
                <button onClick={handlePause}>pause</button>
                <button onClick={handleFail}>fail</button>
                <button onClick={handleRestart}>restart</button>
                <BlockInfo />
            </InfoContainer>
            <VisualMode />
        </>
    );
}

export default MiningView;
