import { BlockHeightAccent } from './components/BlockHeightAccent';
import { Ruler } from './components/Ruler';
import Earnings from './components/Earnings';
import BlockTime from './components/BlockTime';

import { MiningViewContainer } from './MiningView.styles.ts';
import BlockExplorerMini from '../components/BlockExplorerMini/BlockExplorerMini.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useConfigUIStore } from '@app/store';

export default function MiningView() {
    const blockBubblesEnabled = useUIStore((s) => s.blockBubblesEnabled);
    const visualModeEnabled = useConfigUIStore((s) => s.visual_mode);

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
                visualModeEnabled && <BlockExplorerMini />
            )}
        </MiningViewContainer>
    );
}
