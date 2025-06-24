import MiningButton from '../../components/MiningButton/MiningButton.tsx';
import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import MiningTiles from '../../components/MiningTiles/MiningTiles.tsx';

export default function MiningSection() {
    return (
        <>
            <MiningButton />
            <LostConnectionAlert />
            <MiningTiles />
        </>
    );
}
