import { AnimatePresence } from 'motion/react';

import { AmtWrapper, EarningsContainer, EarningsWrapper, RecapText, WinText, WinWrapper } from './Earnings.styles.ts';

import { Trans, useTranslation } from 'react-i18next';
import { handleReplayComplete, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { removeXTMCryptoDecimals } from '@app/utils/formatters.ts';
import i18n from 'i18next';
import NumberFlow from '@number-flow/react';
import { useEffect, useState } from 'react';

const hideDelay = 5400;
const numberFlowDelay = 300;

const line1Animation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
    transition: { delay: 0 },
};

const line2Animation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
    transition: { delay: 0.2 },
};

export default function Earnings() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const replayItem = useBlockchainVisualisationStore((s) => s.replayItem);
    const earnings = useBlockchainVisualisationStore((s) => s.earnings);
    const recapData = useBlockchainVisualisationStore((s) => s.recapData);
    const displayEarnings = replayItem?.tokenAmount || recapData?.totalEarnings || earnings;
    const [value, setValue] = useState(0);
    const [show, setShow] = useState(false);

    const handleHide = () => {
        setShow(false);
        setValue(0);
        handleReplayComplete();
    };

    const formatValue = (displayEarnings: number) => {
        const minotariVal = removeXTMCryptoDecimals(displayEarnings);
        let val = minotariVal;
        if (minotariVal > 1000) {
            val = Math.floor(minotariVal / 10) * 10; // to match sidebar value's formatting
        }
        return val;
    };

    useEffect(() => {
        if (displayEarnings) {
            setShow(true);

            const spinTimeout = setTimeout(() => {
                setValue(formatValue(displayEarnings));
            }, numberFlowDelay);

            const hideTimeout = setTimeout(() => {
                handleHide();
            }, hideDelay);

            return () => {
                clearTimeout(hideTimeout);
                clearTimeout(spinTimeout);
            };
        } else {
            handleHide();
        }
    }, [displayEarnings]);

    const replayText =
        replayItem?.tokenAmount && replayItem.mined_in_block_height ? (
            <RecapText {...line1Animation} key="replay-text">
                <Trans
                    ns="mining-view"
                    i18nKey={'you-won-block'}
                    values={{
                        blockHeight: replayItem.mined_in_block_height,
                    }}
                    components={{ span: <span /> }}
                />
            </RecapText>
        ) : null;

    const recapText = recapData?.totalEarnings ? (
        <RecapText {...line1Animation} key="recap-text">
            <Trans
                ns="mining-view"
                i18nKey={'you-won-while-away'}
                values={{
                    blocks: `${recapData.count} block${recapData.count === 1 ? `` : 's'}`,
                }}
                components={{ span: <span /> }}
            />
        </RecapText>
    ) : null;

    return (
        <EarningsContainer>
            <AnimatePresence>
                {show && (
                    <EarningsWrapper>
                        {replayText}
                        {recapText}
                        <WinWrapper {...line2Animation} key="win-wrapper">
                            <WinText>{t('your-reward-is')}</WinText>
                            <AmtWrapper>
                                <NumberFlow
                                    locales={i18n.language}
                                    format={{
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                        notation: 'compact',
                                        style: 'decimal',
                                    }}
                                    value={value}
                                    isolate={true}
                                />
                            </AmtWrapper>
                            <WinText>{`XTM`}</WinText>
                        </WinWrapper>
                    </EarningsWrapper>
                )}
            </AnimatePresence>
        </EarningsContainer>
    );
}
