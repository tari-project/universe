import { TransactionInfo } from '@app/types/app-status.ts';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks';
import { Wrapper } from './styles.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { getListEntries } from './getListEntries.tsx';
import { useCallback, useRef, useState } from 'react';

interface TransactionDetailsProps {
    item: TransactionInfo;
    expanded: boolean;
    handleClose: () => void;
}

export const TransactionDetails = ({ item, expanded, handleClose }: TransactionDetailsProps) => {
    const [showHidden, setShowHidden] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { t } = useTranslation('wallet');

    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
    const clickCountRef = useRef(0);

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

    const _entries = getListEntries(item, showHidden);

    const copyIcon = !isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper onClick={handleClick}>
                <StatusList entries={_entries} />
            </Wrapper>
            <Button size="large" fluid icon={copyIcon} onClick={() => copyToClipboard(JSON.stringify(item))}>
                {t('send.transaction-copy-raw')}
            </Button>
        </TransactionModal>
    );
};
