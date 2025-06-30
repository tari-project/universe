import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import MiningTiles from '../../components/MiningTiles/MiningTiles.tsx';
import MiningButtonCombined from '../../components/MiningButtonCombined/MiningButtonCombined.tsx';

export default function MiningSection() {
    return (
        <>
            <MiningButtonCombined />
            <LostConnectionAlert />
            <MiningTiles />
        </>
    );
}
