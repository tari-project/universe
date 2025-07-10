import { useConfigUIStore } from '@app/store';
import { BlockHeightAccent } from './components/BlockHeightAccent.tsx';
import { Ruler } from './components/Ruler.tsx';
import Earnings from './components/Earnings.tsx';
import BlockTime from './components/BlockTime.tsx';
import BlockExplorerMini from '../components/BlockExplorerMini/BlockExplorerMini.tsx';
import { MiningViewContainer } from './MiningView.styles.ts';

export default function MiningView() {
    const visualModeEnabled = useConfigUIStore((s) => s.visual_mode);
    return (
        <MiningViewContainer>
            <Earnings />
            {!visualModeEnabled ? (
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
