import { CardItem } from './Settings.styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTheme } from 'styled-components';

export interface CardComponentProps {
    heading: string;
    labels: { labelText: string; labelValue: string }[];
}

export const CardComponent = ({ heading, labels }: CardComponentProps) => {
    const theme = useTheme();
    return (
        <CardItem>
            <Typography variant="h6" style={{ color: theme.palette.text.primary, lineHeight: '14px' }}>
                {heading}
            </Typography>
            <Stack gap={3}>
                {labels.map(({ labelText, labelValue }) => (
                    <Stack key={`label-${labelText}`} direction="row" justifyContent="flex-start">
                        <Typography>{labelText}:</Typography>
                        <Typography style={{ color: theme.palette.text.primary }}>{labelValue}</Typography>
                    </Stack>
                ))}
            </Stack>
        </CardItem>
    );
};
