import BlockTime from './components/BlockTime';

import Earnings from '@app/containers/Dashboard/MiningView/components/Earnings.tsx';

import { MiningViewContainer } from './MiningView.styles.ts';
import { Ruler } from '@app/containers/Dashboard/MiningView/components/Ruler.tsx';
import { LayoutGroup } from 'framer-motion';
import { BlockHeightAccent } from '@app/containers/Dashboard/MiningView/components/BlockHeightAccent.tsx';

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
