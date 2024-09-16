import { listen } from '@tauri-apps/api/event';
import { useState } from 'react';

export type UpdateStatus = 'NONE' | 'DOWNLOADING' | 'DONE';

interface UpdateStatusEvent {
    status: UpdateStatus;
    error: null | string;
}

interface UpdateDownloadProgressEvent {
    contentLength: number;
    chunkLength: number;
    downloaded: number;
}

export const useUpdateStatus = () => {
    const [status, setStatus] = useState<UpdateStatus>('NONE');
    const [contentLength, setContentLength] = useState<number>(0);
    const [downloaded, setDownloaded] = useState<number>(0);

    listen<UpdateStatusEvent>('tauri://update-status', (status) => {
        const statusString = status.payload.status;
        setStatus(statusString);
    });

    listen<UpdateDownloadProgressEvent>('update-progress', (progressEvent) => {
        const contentLength = progressEvent.payload.contentLength;
        setContentLength(contentLength);
        if (contentLength === 0) {
            setStatus('NONE');
        }
        if (contentLength > 0) {
            setStatus('DOWNLOADING');
            const downloaded = progressEvent.payload.downloaded;
            setDownloaded(downloaded);
        }
    });

    return { status, contentLength, downloaded };
};
