import { backgrounds } from '@app/theme/colors';
import { LinearProgress, linearProgressClasses, Stack, styled } from '@mui/material';

const AutoMinerContainerOptions = {
    shouldForwardProp: (prop: string) => prop !== 'percentage',
};
export const AutoMinerContainer = styled(
    Stack,
    AutoMinerContainerOptions
)<{ percentage: number }>(({ theme }) => ({
    backgroundColor: backgrounds.medGrey,
    borderRadius: theme.shape.borderRadius,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    gap: theme.spacing(1),
}));

export const AutoMinerProgressBar = styled(LinearProgress)({
    backgroundColor: '#18875044',
    height: '4px',
    [`& .${linearProgressClasses.barColorPrimary}`]: {
        backgroundColor: '#188750',
        height: '4px',
    },
});
