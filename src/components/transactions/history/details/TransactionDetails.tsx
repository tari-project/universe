import { TransactionInfo } from '@app/types/app-status.ts';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks';
import { Wrapper } from './styles.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { getListEntries } from '@app/components/transactions/history/details/getListEntries.ts';

interface TransactionDetailsProps {
    item: TransactionInfo;
    expanded: boolean;
    handleClose: () => void;
}

export const TransactionDetails = ({ item, expanded, handleClose }: TransactionDetailsProps) => {
    const { t } = useTranslation('wallet');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const _entries = getListEntries(item);
    const copyIcon = !isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper>
                <StatusList entries={_entries} />
            </Wrapper>
            <Button size="large" fluid icon={copyIcon} onClick={() => copyToClipboard(JSON.stringify(item))}>
                {t('send.transaction-copy-raw')}
            </Button>
        </TransactionModal>
    );
};
