import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { Wrapper } from './styles.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { getListEntries } from './getListEntries.tsx';
import { CombinedBridgeWalletTransaction } from '@app/store';

interface TransactionDetailsProps {
    item: CombinedBridgeWalletTransaction;
    expanded: boolean;
    handleClose: () => void;
}

export const TransactionDetails = ({ item, expanded, handleClose }: TransactionDetailsProps) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { t } = useTranslation('wallet');

    const entries = getListEntries(item);

    const copyIcon = !isCopied ? <IoCopyOutline size={14} /> : <IoCheckmarkOutline size={14} />;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper>
                <StatusList entries={entries} />
            </Wrapper>
            <Button size="large" fluid icon={copyIcon} onClick={() => copyToClipboard(JSON.stringify(item))}>
                {t('send.transaction-copy-raw')}
            </Button>
        </TransactionModal>
    );
};
