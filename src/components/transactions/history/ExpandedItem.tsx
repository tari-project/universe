import { memo } from 'react';
import { TransactionInfo } from '@app/types/app-status.ts';
import { InfoItemWrapper, InfoWrapper } from './ListItem.styles.ts';

const ItemExpand = memo(function ItemExpand({ item }: { item: TransactionInfo }) {
    const items = Object.keys(item).map((field) => (
        <InfoItemWrapper key={field}>
            <strong>{`${field}:`}</strong>
            <span>{item[field]?.toString()}</span>
        </InfoItemWrapper>
    ));

    return <InfoWrapper>{items}</InfoWrapper>;
});

export default ItemExpand;
