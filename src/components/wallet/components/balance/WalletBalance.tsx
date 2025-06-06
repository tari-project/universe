import i18n from 'i18next';
import { type Format } from '@number-flow/react';
import { useTranslation } from 'react-i18next';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { useUIStore, useWalletStore } from '@app/store';

import { roundToTwoDecimals, removeXTMCryptoDecimals } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import NumbersLoadingAnimation from '@app/containers/navigation/components/Wallet/NumbersLoadingAnimation/NumbersLoadingAnimation.tsx';
import {
    AvailableWrapper,
    BalanceTextWrapper,
    BalanceWrapper,
    Hidden,
    StyledNumberFlow,
    SuffixWrapper,
    Wrapper,
} from './styles.ts';
import { toggleHideWalletBalance } from '@app/store/actions/uiStoreActions.ts';
import { useState } from 'react';
import { ActionButton } from '@app/components/wallet/components/details/actions/styles.ts';

export default function WalletBalance() {
    const { t } = useTranslation('wallet');
    const [hovering, setHovering] = useState(false);

    const { formattedAvailableBalance } = useTariBalance();
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const balanceValue = removeXTMCryptoDecimals(roundToTwoDecimals(calculated_balance || 0));
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const visibilityButton = (
        <ActionButton onClick={toggleHideWalletBalance}>
            {hideWalletBalance ? <IoEyeOutline /> : <IoEyeOffOutline />}
        </ActionButton>
    );
    const formatOptions: Format = {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    };

    return (
        <Wrapper onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            {!isWalletScanning ? (
                <>
                    <BalanceWrapper>
                        <BalanceTextWrapper>
                            {hideWalletBalance ? (
                                <Hidden>{`*******`}</Hidden>
                            ) : (
                                <StyledNumberFlow
                                    isolate
                                    locales={i18n.language}
                                    format={formatOptions}
                                    value={balanceValue}
                                />
                            )}
                            <SuffixWrapper>{` XTM`}</SuffixWrapper>
                        </BalanceTextWrapper>
                        {hovering && visibilityButton}
                    </BalanceWrapper>

                    <AvailableWrapper>
                        <Typography>{`${t('history.available-balance')}: ${formattedAvailableBalance} XTM`}</Typography>
                    </AvailableWrapper>
                </>
            ) : (
                <NumbersLoadingAnimation />
            )}
        </Wrapper>
    );
}
