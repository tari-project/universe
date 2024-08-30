import { CardItem } from './Settings.styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

export interface CardComponentProps {
    heading: string;
    labels: { labelText: string; labelValue: string }[];
}

export const CardComponent = ({ heading, labels }: CardComponentProps) => {
    return (
        <CardItem>
            <Typography variant="h6">{heading}</Typography>
            <Stack>
                {labels.map(({ labelText, labelValue }) => (
                    <Stack key={labelText}>
                        <Typography key={labelText}>{labelText}:</Typography>
                        <Typography key={labelValue}>{labelValue}</Typography>
                    </Stack>
                ))}
            </Stack>
        </CardItem>
    );
};
