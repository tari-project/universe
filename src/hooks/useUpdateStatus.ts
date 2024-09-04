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
}

export const useUpdateStatus = () => {
    const [status, setStatus] = useState<UpdateStatus>('NONE');
    const [contentLength, setContentLength] = useState<number>(0);

    listen<UpdateStatusEvent>('tauri://update-status', (status) => {
        const statusString = status.payload.status;
        setStatus(statusString);
    });

    listen<UpdateDownloadProgressEvent>('tauri://update-download-progress', (progressEvent) => {
        const contentLength = progressEvent.payload.contentLength;
        setContentLength(contentLength);
        if (contentLength === 0) {
            setStatus('NONE');
        }
        if (contentLength > 0) {
            setStatus('DOWNLOADING');
        }
    });

    return { status, contentLength };
};
