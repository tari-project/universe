import CPUTile from './CPU.tsx';
import GPUTile from './GPU.tsx';

import { Wrapper } from './styles';

export default function MiningTiles() {
    return (
        <Wrapper>
            <CPUTile />
            <GPUTile />
        </Wrapper>
    );
}
