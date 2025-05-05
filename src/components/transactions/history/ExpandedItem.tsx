import { memo, useCallback, useRef, useState } from 'react';
import { TransactionInfo } from '@app/types/app-status.ts';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { StatusList } from '../components/StatusList/StatusList.tsx';
import { useTranslation } from 'react-i18next';
import { formatTimeStamp } from '@app/components/transactions/history/helpers.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { formatNumber, FormatPreset } from '@app/utils';
import { useMiningStore } from '@app/store';
import { Network } from '@app/utils/network.ts';

interface Props {
    item: TransactionInfo;
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
    handleClose: () => void;
}

const ItemExpand = memo(function ItemExpand({ item, expanded, handleClose }: Props) {
    const network = useMiningStore((state) => state.network);
    const explorerURL = `https://${network === Network.Esmeralda ? 'textexplore-esmeralda' : network === Network.NextNet ? 'explore-nextnet' : 'explore'}.tari.com`;
    const { t } = useTranslation('wallet');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const [showHidden, setShowHidden] = useState(false);
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const itemTime = formatTimeStamp(item.timestamp);
    const keyTranslations: Record<string, string> = {
        tx_id: 'send.transaction-id',
        payment_id: 'send.transaction-description',
    };

    const hiddenKeys = ['direction', 'excess_sig'];

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
            let _value = value;
            let externalLink: string | undefined;
            let valueRight: string | undefined;
            if (key === 'mined_in_block_height' && value) {
                externalLink = `${explorerURL}/blocks/${value}`;
            }

            if (key === 'timestamp') {
                _value = itemTime;
                valueRight = value;
            }

            if (key === 'amount') {
                const preset = value.toString().length > 5 ? FormatPreset.TXTM_LONG : FormatPreset.TXTM_DECIMALS;
                _value = formatNumber(value, preset);
                valueRight = `${formatNumber(value, FormatPreset.DECIMAL_COMPACT)} µT`;
            }

            return {
                label: key in keyTranslations ? t(keyTranslations[key]) : capitalizeKey(key),
                value: _value,
                externalLink,
                valueRight,
            };
        });

    const copyIcon = !isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <div
                onClick={handleClick}
                style={{
                    height: `100%`,
                    maxHeight: `78vh`,
                    overflowY: `auto`,
                }}
            >
                <StatusList entries={entries} />
            </div>
            <Button size="large" fluid icon={copyIcon} onClick={() => copyToClipboard(JSON.stringify(item))}>
                {t('send.transaction-copy-raw')}
            </Button>
        </TransactionModal>
    );
});

export default ItemExpand;
