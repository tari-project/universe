import { BlockHeightAccent } from './components/BlockHeightAccent';
import { Ruler } from './components/Ruler';
import Earnings from './components/Earnings';
import BlockTime from './components/BlockTime';

import { MiningViewContainer } from './MiningView.styles.ts';
import BlockExplorerMini from '../components/BlockExplorerMini/BlockExplorerMini.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

export default function MiningView() {
    const blockBubblesEnabled = useUIStore((s) => s.blockBubblesEnabled);

    return (
        <MiningViewContainer>
            <Earnings />

            {!blockBubblesEnabled ? (
                <>
                    <BlockHeightAccent />
                    <Ruler />
                    <BlockTime />
                </>
            ) : (
                <BlockExplorerMini />
            )}
        </MiningViewContainer>
    );
}
