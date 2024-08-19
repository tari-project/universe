import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';

import { InfoContainer } from '../styles';
import { useVisualisation } from '@app/hooks/useVisualisation.ts';

function MiningView() {
    const handleVisual = useVisualisation();
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <button onClick={() => handleVisual('start')}>start</button>
                <button onClick={() => handleVisual('fail')}>fail</button>
                <button onClick={() => handleVisual('success')}>success</button>
                <button onClick={() => handleVisual('pause')}>pause</button>
                <button onClick={() => handleVisual('stop')}>stop</button>
                <BlockInfo />
            </InfoContainer>
            <VisualMode />
        </>
    );
}

export default MiningView;
