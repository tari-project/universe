import { memo, useState, useCallback, useRef } from 'react';
import { TransactionInfo } from '@app/types/app-status.ts';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { StatusList } from '../components/StatusList/StatusList.tsx';
import { useTranslation } from 'react-i18next';

interface Props {
    item: TransactionInfo;
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
    handleClose: () => void;
}

const ItemExpand = memo(function ItemExpand({ item, expanded, handleClose }: Props) {
    const { t } = useTranslation('wallet');
    const [showHidden, setShowHidden] = useState(false);
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

    const keyTranslations: Record<string, string> = {
        tx_id: 'send.transaction-id',
        payment_id: 'send.transaction-description',
    };

    const hiddenKeys = ['direction'];

    const capitalizeKey = (key: string): string => {
        return key
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleClick = useCallback(() => {
        clickCountRef.current += 1;

        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
        }

        clickTimerRef.current = setTimeout(() => {
            if (clickCountRef.current >= 3) {
                setShowHidden(!showHidden);
            }
            clickCountRef.current = 0;
        }, 300);
    }, [showHidden]);

    const entries = Object.entries(item)
        .filter(([key]) => showHidden || !hiddenKeys.includes(key))
        .map(([key, value]) => {
            return {
                label: key in keyTranslations ? t(keyTranslations[key]) : capitalizeKey(key),
                value,
            };
        });

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <div onClick={handleClick}>
                <StatusList entries={entries} />
            </div>
        </TransactionModal>
    );
});

export default ItemExpand;
