import { Stack, Typography } from '@mui/material';
import { CardItem } from './Settings.styles';

export interface CardComponentProps {
    heading: string;
    labels: { labelText: string; labelValue: string }[];
}

export const CardComponent = ({ heading, labels }: CardComponentProps) => {
    return (
        <CardItem gap={1}>
            <Typography variant="h6">{heading}</Typography>
            <Stack gap={0.5}>
                {labels.map(({ labelText, labelValue }) => (
                    <Stack direction="row" key={labelText} gap={1}>
                        <Typography key={labelText}>{labelText}:</Typography>
                        <Typography sx={{ color: 'black' }} key={labelValue}>
                            {labelValue}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </CardItem>
    );
};
