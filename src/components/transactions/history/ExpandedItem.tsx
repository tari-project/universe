import { memo } from 'react';
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

    const entries = Object.entries(item).map(([key, value]) => ({ label: key, value }));

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <StatusList entries={entries} />
        </TransactionModal>
    );
});

export default ItemExpand;
