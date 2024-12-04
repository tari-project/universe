import * as Sentry from '@sentry/react';
import { LayoutGroup } from 'framer-motion';
import { BlockHeightAccent } from './components/BlockHeightAccent';
import { Ruler } from './components/Ruler';
import Earnings from './components/Earnings';
import BlockTime from './components/BlockTime';

import { MiningViewContainer } from './MiningView.styles.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export default function MiningView() {
    function handleErr() {
        console.error('V2 sentry: test console capture');
        Sentry.captureException('V2 sentry: test capture exception');
        Sentry.captureMessage('V2 sentry: test capture message');
    }
    return (
        <MiningViewContainer layout layoutId="mining-view--content">
            <LayoutGroup>
                <Button onClick={handleErr} style={{ position: 'absolute', zIndex: 9999, pointerEvents: 'all' }}>
                    {`click me for an error!`}
                </Button>
                <BlockHeightAccent />
                <Ruler />
                <Earnings />
                <BlockTime />
            </LayoutGroup>
        </MiningViewContainer>
    );
}
