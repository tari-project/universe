import i18n from 'i18next';
import NumberFlow, { type Format } from '@number-flow/react';
import { useTranslation } from 'react-i18next';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { useConfigWalletStore, useUIStore, useWalletStore } from '@app/store';

import { roundToTwoDecimals, removeXTMCryptoDecimals, formatNumber, FormatPreset } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import NumbersLoadingAnimation from '@app/containers/navigation/components/Wallet/NumbersLoadingAnimation/NumbersLoadingAnimation.tsx';
import { AvailableWrapper, BalanceTextWrapper, BalanceWrapper, Hidden, SuffixWrapper, Wrapper } from './styles.ts';
import { toggleHideWalletBalance } from '@app/store/actions/uiStoreActions.ts';
import { useState } from 'react';
import { ActionButton } from '@app/components/wallet/components/details/actions/styles.ts';
import { AnimatePresence } from 'motion/react';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';

export const WalletBalance = () => {
    const { t } = useTranslation('wallet');
    const [hovering, setHovering] = useState(false);

    const last_known_balance = useConfigWalletStore((s) => s.last_known_balance);
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const available_balance = useWalletStore((s) => s.balance?.available_balance);

    const balanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(calculated_balance || 0));
    const availableBalanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(available_balance || 0));

    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const scanProgress = useWalletStore((s) => s.wallet_scanning?.progress);
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const formattedAvailableBalance = formatNumber(last_known_balance || available_balance || 0, FormatPreset.XTM_LONG);
    const finalAvailableBalance = hideWalletBalance ? '*******' : formattedAvailableBalance;

    const formatOptions: Format = {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    };
    const isLoading = !last_known_balance && isWalletScanning;

    const bottomMarkup = !isWalletScanning ? (
        <AvailableWrapper>
            {availableBalanceValue != balanceValue ? (
                <Typography>{`${t('history.available-balance')}: ${finalAvailableBalance} XTM`}</Typography>
            ) : (
                <Typography>{t('history.my-balance')}</Typography>
            )}
        </AvailableWrapper>
    ) : (
        <AvailableWrapper>
            <strong>{`Wallet is scanning `}</strong> {`${Math.floor(scanProgress)}%`}
        </AvailableWrapper>
    );
    return (
        <Wrapper onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            {!isLoading ? (
                <>
                    <BalanceWrapper>
                        <BalanceTextWrapper>
                            {hideWalletBalance ? (
                                <Hidden>{`*******`}</Hidden>
                            ) : (
                                <NumberFlow locales={i18n.language} format={formatOptions} value={balanceValue} />
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
                                    {hideWalletBalance ? <IoEyeOutline /> : <IoEyeOffOutline />}
                                </ActionButton>
                            )}
                        </AnimatePresence>
                    </BalanceWrapper>

                    {bottomMarkup}
                </>
            ) : (
                <NumbersLoadingAnimation />
            )}

            {isWalletScanning ? <CircularProgress /> : null}
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
