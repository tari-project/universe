import styled from 'styled-components';
import LostConnectionAlert from '../../components/LostConnectionAlert.tsx';
import MiningTiles from '../../components/MiningTiles/MiningTiles.tsx';
import MiningButtonCombined from '../../components/MiningButtonCombined/MiningButtonCombined.tsx';
import SetScheduleButton from '../../components/scheduler/SetScheduleButton.tsx';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;
export default function MiningSection() {
    return (
        <Wrapper>
            <MiningButtonCombined />
            <SetScheduleButton />
            <LostConnectionAlert />
            <MiningTiles />
        </Wrapper>
    );
}
