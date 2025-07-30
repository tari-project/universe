import ExchangeButton from './components/exchange-button/ExchangeButton.tsx';
import CPUTile from './CPU.tsx';
import GPUTile from './GPU.tsx';

import { TopRow, Wrapper } from './styles';
import { useConfigBEInMemoryStore } from '@app/store';

export default function MiningTiles() {
    const isExchangeSpecific = useConfigBEInMemoryStore((s) => s.exchangeId !== 'universal');
    return (
        <Wrapper>
            <TopRow>
                <CPUTile />
                <GPUTile />
            </TopRow>
            {!isExchangeSpecific && <ExchangeButton />}
        </Wrapper>
    );
}
