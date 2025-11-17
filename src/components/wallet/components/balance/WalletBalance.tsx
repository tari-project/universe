import i18n from 'i18next';
import NumberFlow, { type Format } from '@number-flow/react';
import { Trans, useTranslation } from 'react-i18next';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { useConfigWalletStore, useNodeStore, useUIStore, useWalletStore } from '@app/store';

import { roundToTwoDecimals, removeXTMCryptoDecimals, formatNumber, FormatPreset, formatValue } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';

import {
    BottomWrapper,
    BalanceTextWrapper,
    BalanceWrapper,
    Hidden,
    ScanProgressWrapper,
    SuffixWrapper,
    Wrapper,
    LoadingText,
} from './styles.ts';
import { toggleHideWalletBalance } from '@app/store/actions/uiStoreActions.ts';
import { useState } from 'react';
import { ActionButton } from '@app/components/wallet/components/details/actions/styles.ts';
import { AnimatePresence } from 'motion/react';
import { Progress } from '@app/components/elements/loaders/CircularProgress/Progress.tsx';
import SyncCountdown from '@app/components/wallet/components/loaders/SyncLoading/SyncCountdown.tsx';
import { AppModuleStatus } from '@app/store/types/setup.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';

const formatOptions: Format = {
    maximumFractionDigits: 2,
    notation: 'standard',
    style: 'decimal',
};

export const WalletBalance = () => {
    const [isComplete, setIsComplete] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const { t } = useTranslation('wallet');
    const [hovering, setHovering] = useState(false);

    const walletModule = useSetupStore(setupStoreSelectors.selectWalletModule);
    const walletModuleFailed = walletModule?.status === AppModuleStatus.Failed;

    const hideBalance = useUIStore((s) => s.hideWalletBalance);
    const isConnected = useNodeStore((s) => s.isNodeConnected);
    const cached = useConfigWalletStore((s) => s.last_known_balance);
    const available = useWalletStore((s) => s.balance?.available_balance);
    const total = useWalletStore((s) => s.calculated_balance);
    const scanData = useWalletStore((s) => s.wallet_scanning);

    const isScanning = !scanData.is_initial_scan_finished;
    const scanProgress = Math.floor(scanData.progress * 10) / 10;

    const balance = removeXTMCryptoDecimals(roundToTwoDecimals(total || 0));
    const balanceMismatch = removeXTMCryptoDecimals(roundToTwoDecimals(available || 0)) != balance;

    const displayText = hideBalance ? '*******' : formatNumber(available || 0, FormatPreset.XTM_LONG);
    const isLoading = !isConnected || isScanning;

    const balanceText = balanceMismatch
        ? `${t('history.available-balance')}: ${displayText} XTM`
        : t('history.my-balance');

    const loadingMarkup = (
        <LoadingText>
            {scanData && isConnected ? (
                <Trans>
                    {scanProgress < 100
                        ? t('wallet-scanning-with-progress', {
                              percentage: scanProgress,
                              scanned: formatValue(scanData.scanned_height),
                              total: formatValue(scanData.total_height),
                          })
                        : t('wallet-is-scanning')}
                </Trans>
            ) : null}
            {!isConnected && (
                <>
                    <Trans>{t('wallet-is-scanning')}</Trans>
                    <SyncCountdown
                        onStarted={() => setIsStarted(true)}
                        onCompleted={() => setIsComplete(true)}
                        isCompact={true}
                    />
                    {isStarted && !isComplete && isScanning && t('sync-message.line2')}
                </>
            )}
        </LoadingText>
    );

    // const bottomMarkup = !isLoading ? <Typography>{balanceText}</Typography> : loadingMarkup;
    let bottomMarkup;
    if (scanData.total_height === 0 && isScanning) {
        bottomMarkup = <></>;
    } else if (isLoading) {
        bottomMarkup = loadingMarkup;
    } else {
        bottomMarkup = <Typography>{balanceText}</Typography>;
    }

    const progressMarkup = isLoading && !walletModuleFailed && (
        <ScanProgressWrapper>
            <Progress
                percentage={scanProgress && scanProgress >= 95 ? scanProgress - 9 : scanProgress} // so you can actually still see the little gap
                isInfinite={!isConnected || scanProgress === 100}
            />
        </ScanProgressWrapper>
    );

    return (
        <Wrapper onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            <BalanceWrapper>
                <BalanceTextWrapper>
                    {hideBalance ? (
                        <Hidden>{`*******`}</Hidden>
                    ) : (
                        <NumberFlow locales={i18n.language} format={formatOptions} value={balance} />
                    )}
                    <SuffixWrapper>{` XTM`}</SuffixWrapper>
                </BalanceTextWrapper>
                <AnimatePresence>
                    {hovering && (
                        <ActionButton
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={toggleHideWalletBalance}
                        >
                            {hideBalance ? <IoEyeOutline /> : <IoEyeOffOutline />}
                        </ActionButton>
                    )}
                </AnimatePresence>
            </BalanceWrapper>
            <BottomWrapper>{bottomMarkup}</BottomWrapper>

            {progressMarkup}
        </Wrapper>
    );
};

export const WalletBalanceHidden = () => {
    return (
        <Wrapper>
            <BalanceWrapper>
                <BalanceTextWrapper>
                    <Hidden>{`*******`}</Hidden>
                    <SuffixWrapper>{` XTM`}</SuffixWrapper>
                </BalanceTextWrapper>
            </BalanceWrapper>
        </Wrapper>
    );
};
