import { LinearProgress } from '@app/components/elements/LinearProgress';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ProgressWrapper } from '@app/containers/Dashboard/styles';
import { UpdateStatus } from '@app/hooks/useUpdateStatus';
import { useTranslation } from 'react-i18next';

export interface UpdatedStatusProps {
    contentLength: number;
    downloaded: number;
    status: UpdateStatus;
}

export function UpdatedStatus({ contentLength, status, downloaded }: UpdatedStatusProps) {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const formatSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    };
    const contentDescription = status === 'DOWNLOADING' ? t('updating-downloading') : t('updating-downloading-done');

    return (
        <Stack>
            <Typography variant="h6">{t('updating-title')}</Typography>
            <Typography variant="p">{t(contentDescription)}</Typography>
            <Typography variant="p">{`${formatSize(downloaded)} / ${formatSize(contentLength)}`}</Typography>
            <ProgressWrapper>
                <LinearProgress value={(downloaded / contentLength) * 100} variant="secondary" />
            </ProgressWrapper>
        </Stack>
    );
}
