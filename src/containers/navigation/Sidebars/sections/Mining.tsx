import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import Miner from '../../components/Miner/Miner.tsx';
import MiningButtonCombined from '../../components/MiningButtonCombined/MiningButtonCombined.tsx';

export default function MiningSection() {
    return (
        <>
            <MiningButtonCombined />
            <LostConnectionAlert />
            <Miner />
        </>
    );
}
