import { useCallback, useState } from 'react';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

export async function uploadFile(url: string, formData: FormData) {
    const response = await fetch(`${url}/upload_template`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return data;
}

function TemplateFileUploader() {
    const [selectedFilePath, setSelectedFilePath] = useState<string>('');

    const handleFileUpload = useCallback(async () => {
        console.info('handle file upload path ', selectedFilePath);
        invoke('upload_wasm_file', { file: selectedFilePath }).catch((e) => console.error('Failed to upload', e));
    }, [selectedFilePath]);

    const handleFileSelect = useCallback(async () => {
        console.info('handle file select ');
        const file = await open({
            multiple: false,
            directory: false,
        });
        console.info('handle file', file);
        if (file) {
            setSelectedFilePath(file);
        }
        console.info('handle file upload file path', file);
    }, []);

    return (
        <div className="template">
            <Typography>{'Upload wasm file'}</Typography>
            <Typography>{`Path: ${selectedFilePath}`}</Typography>
            <SquaredButton
                onClick={handleFileSelect}
                color="tariPurple"
                size="medium"
                style={{ width: '25%', alignContent: 'center', marginBottom: 10 }}
            >
                {'Select wasm file'}
            </SquaredButton>
            <SquaredButton
                onClick={handleFileUpload}
                color="tariPurple"
                size="medium"
                style={{ width: '25%', alignContent: 'center', marginBottom: 10 }}
            >
                {'Upload wasm file'}
            </SquaredButton>
        </div>
    );
}

export default TemplateFileUploader;
