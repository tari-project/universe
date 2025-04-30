import { useEffect, useMemo, useState } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useUIStore } from '@app/store';

function useTariBalance() {
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);
    const [showLongBalance, setShowLongBalance] = useState(false);
    const [shouldAnimateBalance, setShouldAnimateBalance] = useState(true);

    const balance = useWalletStore((s) => s.balance);
    const calculated_balance = useWalletStore((s) => s.calculated_balance);

    const formattedBalance = formatNumber(calculated_balance || 0, FormatPreset.XTM_COMPACT);
    const formattedLongBalance = formatNumber(calculated_balance || 0, FormatPreset.XTM_LONG);
    const numericAvailableBalance = Number(Math.floor((balance?.available_balance || 0) / 1_000_000).toFixed(2));

    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const balanceDisplayValue = useMemo(
        () => (isWalletScanning ? '-' : !hideWalletBalance ? formattedBalance : '*****'),
        [formattedBalance, isWalletScanning, hideWalletBalance]
    );

    function toggleBalanceFormat({ isMouseOver = false }: { isMouseOver?: boolean }) {
        if (isWalletScanning) return;
        setShouldAnimateBalance(false);
        setShowLongBalance(isMouseOver);
    }

    useEffect(() => {
        if (!shouldAnimateBalance) {
            const timer = setTimeout(() => {
                setShouldAnimateBalance(true);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [shouldAnimateBalance]);

    return {
        balanceDisplayValue,
        formattedBalance,
        formattedLongBalance,
        isWalletScanning,
        toggleBalanceFormat,
        showLongBalance,
        shouldAnimateBalance,
        calculated_balance,
        numericAvailableBalance,
    };
}

export { useTariBalance };
