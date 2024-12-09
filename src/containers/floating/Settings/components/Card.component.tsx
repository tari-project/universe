import { ReactNode } from 'react';
import { CardItem, CardItemLabel, CardItemLabelValue, CardItemLabelWrapper, CardItemTitle } from './Settings.styles';
import { truncateMiddle } from '@app/utils/truncateString.ts';

export interface CardComponentProps {
    heading?: string;
    labels: { labelText: ReactNode; labelValue: string | number }[];
}

export const CardComponent = ({ heading, labels }: CardComponentProps) => {
    const labelMarkup = labels.map(({ labelText, labelValue }) => {
        const labelStr = labelValue.toString();
        const shouldTruncate = labelStr.length > 50;
        const displayValue = shouldTruncate ? truncateMiddle(labelStr, 25) : labelValue;
        return (
            <CardItemLabelWrapper key={`label-${labelText}`}>
                <CardItemLabel>{labelText}:</CardItemLabel>
                <CardItemLabelValue title={labelStr}>{displayValue}</CardItemLabelValue>
            </CardItemLabelWrapper>
        );
    });
    return (
        <CardItem>
            {heading ? <CardItemTitle>{heading}</CardItemTitle> : null}
            {labelMarkup}
        </CardItem>
    );
};
