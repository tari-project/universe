import { BlockHeightAccent } from './components/BlockHeightAccent';
import { Ruler } from './components/Ruler';
import Earnings from './components/Earnings';
import BlockTime from './components/BlockTime';

import { MiningViewContainer } from './MiningView.styles.ts';
import BlockExplorerMini from '../components/BlockExplorerMini/BlockExplorerMini.tsx';

export default function MiningView() {
    return (
        <MiningViewContainer>
            <BlockHeightAccent />
            <Ruler />
            <Earnings />
            <BlockTime />
            <BlockExplorerMini />
        </MiningViewContainer>
    );
}
