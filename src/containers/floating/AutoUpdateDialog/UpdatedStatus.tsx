import { LinearProgress } from '@app/components/elements/LinearProgress';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ProgressWrapper } from '@app/containers/main/Dashboard/styles.ts';

interface UpdatedStatusProps {
    contentLength: number;
    downloaded: number;
}

export function UpdatedStatus({ contentLength, downloaded }: UpdatedStatusProps) {
    const formatSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    };

    const shouldShowProgress = contentLength > 0;

    return (
        <Stack alignItems="center" style={{ height: 120 }}>
            <ProgressWrapper>
                <LinearProgress value={(downloaded / contentLength) * 100} variant="small" />
            </ProgressWrapper>
            {shouldShowProgress && (
                <Typography variant="p">{`${formatSize(downloaded)} / ${formatSize(contentLength)}`}</Typography>
            )}
        </Stack>
    );
}
