import BlockInfo from './components/BlockInfo';
import TopStatus from './components/TopStatus';
import VisualMode from '../components/VisualMode';
import MiningButton from './components/MiningButton';
import { InfoContainer } from '../styles';
import { setRestart, setStart, setStop } from '../../../visuals';

function MiningView() {
    return (
        <>
            <InfoContainer>
                <TopStatus />
                <BlockInfo />
                <button onClick={setStart}>start</button>
                <button onClick={setRestart}>restart</button>
                <button onClick={setStop}>stop</button>
            </InfoContainer>
            <VisualMode />
            <MiningButton />
        </>
    );
}

export default MiningView;
