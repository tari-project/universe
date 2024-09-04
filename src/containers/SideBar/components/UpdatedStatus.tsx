import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography.tsx';
import { UpdateStatus } from '@app/hooks/useUpdateStatus';
import { useTranslation } from 'react-i18next';

export interface UpdatedStatusProps {
    contentLength: number;
    status: UpdateStatus;
}

export function UpdatedStatus({ contentLength, status }: UpdatedStatusProps) {
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
            <Typography variant="p">{t('updating-content-size', { size: formatSize(contentLength) })}</Typography>
        </Stack>
    );
}
