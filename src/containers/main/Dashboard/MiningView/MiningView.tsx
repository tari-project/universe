import { LayoutGroup } from 'framer-motion';

import { BlockHeightAccent } from './components/BlockHeightAccent';
import { Ruler } from './components/Ruler';
import Earnings from './components/Earnings';
import BlockTime from './components/BlockTime';

import { MiningViewContainer } from './MiningView.styles.ts';

export default function MiningView() {
    return (
        <MiningViewContainer layout layoutId="mining-view--content">
            <LayoutGroup>
                <BlockHeightAccent />
                <Ruler />
                <Earnings />
                <BlockTime />
            </LayoutGroup>
        </MiningViewContainer>
    );
}
