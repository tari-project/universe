import i18n from 'i18next';
import NumberFlow from '@number-flow/react';

import { useMinerStats } from '@app/hooks/mining/useMinerCount.ts';

import { Content, CountText, Dot, Wrapper } from './styles.ts';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

export default function MinerCount() {
    const { t } = useTranslation('mining-view');
    const { data: totalMiners } = useMinerStats();
    const [contentWidth, setContentWidth] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setContentWidth(contentRef.current?.clientWidth || 0);
    }, []);

    return (
        <Wrapper $contentWidth={contentWidth}>
            <Content ref={contentRef}>
                <Dot />
                <CountText>
                    <NumberFlow
                        value={totalMiners || 0}
                        locales={i18n.language}
                        format={{
                            minimumSignificantDigits: 2,
                            maximumFractionDigits: 2,
                            notation: 'compact',
                        }}
                    />
                    {` ${t('bubbles.active-miners')}`}
                </CountText>
            </Content>
        </Wrapper>
    );
}
