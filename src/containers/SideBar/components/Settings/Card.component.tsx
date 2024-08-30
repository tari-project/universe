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
                    <Stack key={labelText} direction="row" justifyContent="flex-start">
                        <Typography key={labelText}>{labelText}:</Typography>
                        <Typography key={labelValue} style={{ color: '#000' }}>
                            {labelValue}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </CardItem>
    );
};
