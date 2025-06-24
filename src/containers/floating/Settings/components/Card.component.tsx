import { ReactNode } from 'react';
import {
    CardItem,
    CardItemLabel,
    CardItemLabelValue,
    CardItemLabelWrapper,
    CardItemTitle,
    TitleCodeBlock,
} from './Settings.styles';
import { truncateMiddle } from '@app/utils/truncateString.ts';

interface CardComponentProps {
    heading?: string;
    useCodeBlock?: boolean;
    labels: { labelText: ReactNode; labelValue: string | number }[];
}

export const CardComponent = ({ heading, labels, useCodeBlock = false }: CardComponentProps) => {
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

    const headingMarkup =
        heading &&
        (useCodeBlock ? <TitleCodeBlock>{heading}</TitleCodeBlock> : <CardItemTitle>{heading}</CardItemTitle>);
    return (
        <CardItem>
            {headingMarkup}
            {labelMarkup}
        </CardItem>
    );
};
