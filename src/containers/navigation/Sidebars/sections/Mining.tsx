import MiningButton from '../../components/MiningButton/MiningButton.tsx';
import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import Miner from '../../components/Miner/Miner.tsx';

export default function MiningSection() {
    return (
        <>
            <MiningButton />
            <LostConnectionAlert />
            <Miner />
        </>
    );
}
