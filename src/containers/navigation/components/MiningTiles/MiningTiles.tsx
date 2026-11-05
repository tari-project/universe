import CPUTile from './CPU.tsx';
import GPUTile from './GPU.tsx';

import { TopRow, Wrapper } from './styles';

export default function MiningTiles() {
    return (
        <Wrapper>
            <TopRow>
                <CPUTile />
                <GPUTile />
            </TopRow>
        </Wrapper>
    );
}
