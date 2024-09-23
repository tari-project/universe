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
            <Typography variant="h6" style={{ color: '#000', lineHeight: '14px' }}>
                {heading}
            </Typography>
            <Stack gap={3}>
                {labels.map(({ labelText, labelValue }) => (
                    <Stack key={`label-${labelText}`} direction="row" justifyContent="flex-start">
                        <Typography>{labelText}:</Typography>
                        <Typography style={{ color: '#000' }}>{labelValue}</Typography>
                    </Stack>
                ))}
            </Stack>
        </CardItem>
    );
};
