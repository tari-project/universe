import { AnimatePresence, Variants } from 'motion/react';

import { AmtWrapper, EarningsContainer, EarningsWrapper, RecapText, WinText, WinWrapper } from './Earnings.styles.ts';

import { Trans, useTranslation } from 'react-i18next';
import { handleReplayComplete, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { removeXTMCryptoDecimals } from '@app/utils/formatters.ts';
import i18n from 'i18next';
import NumberFlow from '@number-flow/react';
import { useEffect, useState } from 'react';

const variants: Variants = {
    visible: {
        opacity: 1,
        y: '-150%',
        scale: 1.05,
        transition: {
            duration: 1,
            ease: 'linear',
            scale: {
                duration: 0.8,
            },
        },
    },
    hidden: {
        opacity: 0.2,
        y: '-100%',
        transition: { duration: 0.2, delay: 2.4, ease: 'linear' },
    },
};

export default function Earnings() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const replayItem = useBlockchainVisualisationStore((s) => s.replayItem);
    const earnings = useBlockchainVisualisationStore((s) => s.earnings);
    const recapData = useBlockchainVisualisationStore((s) => s.recapData);
    const displayEarnings = replayItem?.transaction_balance || recapData?.totalEarnings || earnings;
    const [value, setValue] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(!!displayEarnings);
    }, [displayEarnings]);

    useEffect(() => {
        if (displayEarnings && show) {
            const minotariVal = removeXTMCryptoDecimals(displayEarnings);
            let val = minotariVal;
            if (minotariVal > 1000) {
                val = Math.floor(minotariVal / 10) * 10; // to match sidebar value's formatting
            }

            setValue(val);
        } else {
            setValue(0);
        }
    }, [displayEarnings, show]);

    const recapText = recapData?.totalEarnings ? (
        <RecapText>
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

    const replayText =
        replayItem?.transaction_balance && replayItem.mined_height ? (
            <RecapText>
                <Trans
                    ns="mining-view"
                    i18nKey={'you-won-block'}
                    values={{
                        blockHeight: replayItem.mined_height,
                    }}
                    components={{ span: <span /> }}
                />
            </RecapText>
        ) : null;

    return (
        <EarningsContainer>
            <AnimatePresence
                onExitComplete={() => {
                    handleReplayComplete();
                }}
            >
                {show && (
                    <EarningsWrapper
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onAnimationComplete={() => {
                            setShow(false);
                        }}
                    >
                        {replayText}
                        {recapText}
                        <WinWrapper>
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
