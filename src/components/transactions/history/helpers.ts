import { TransactionInfo } from '@app/types/app-status.ts';
import { TransactionDirection as D, TransactionStatus as S } from '@app/types/transactions.ts';
import { TransationType } from '@app/components/transactions/types.ts';
import i18n from 'i18next';

interface GetTitleArgs {
    itemType: TransationType;
    blockHeight?: number;
    message?: string;
}

export function getItemType(item: TransactionInfo): TransationType {
    const mined = [S.MinedConfirmed, S.MinedConfirmed, S.CoinbaseConfirmed, S.CoinbaseUnconfirmed];
    const oneSided = [S.OneSidedConfirmed, S.OneSidedUnconfirmed];

    const isMined = item.direction === D.Inbound && mined.includes(item.status) && !oneSided.includes(item.status);

    if (isMined) {
        return 'mined';
    }

    return item.direction === D.Outbound ? 'sent' : 'received';
}

export function getItemTitle({ itemType, blockHeight, message }: GetTitleArgs): string {
    if (itemType === 'mined' && blockHeight) {
        return `${i18n.t('sidebar:block')} #${blockHeight}`;
    }

    if (message && !message.includes('<No message>')) {
        return message;
    }

    return i18n.t(`common:${itemType}`);
}
