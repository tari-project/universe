import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import MiningTiles from '../../components/MiningTiles/MiningTiles.tsx';
import MiningButtonCombined from '../../components/MiningButtonCombined/MiningButtonCombined.tsx';
import SetScheduleButton from '../../components/scheduler/SetScheduleButton.tsx';

export default function MiningSection() {
    return (
        <>
            <MiningButtonCombined />
            <SetScheduleButton />
            <LostConnectionAlert />
            <MiningTiles />
        </>
    );
}
