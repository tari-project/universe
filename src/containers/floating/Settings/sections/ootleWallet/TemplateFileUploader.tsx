import { ChangeEvent, useCallback, useState } from 'react';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';
import { open } from '@tauri-apps/plugin-dialog';
import { upload } from '@tauri-apps/plugin-upload';

const WALLET_JSON_RPC_ADDRESS = '127.0.0.1:1420'; // TODO use db to get endpoint

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
    // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     console.info('-------->>> handle file change');
    //     console.info('file', event.target.files);
    //     const file = event.target.files?.item(0);
    //     console.info('handle file', file);
    //     if (file) {
    //         setSelectedFilePath(file);
    //     }
    // };

    const handleFileUpload = useCallback(async () => {
        const url = `http://localhost:18000/upload_template`;
        console.info('handle file upload ', url);
        console.info('handle file upload path ', selectedFilePath);
        upload(
            url,
            selectedFilePath,
            ({ progress, total }) => console.info(` ^^^^^ Uploaded ${progress} of ${total} bytes`) // a callback that will be called with the upload progress
            // { 'Content-Type': 'text/plain' } // optional headers to send with the request
        );
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
        // if (!selectedFile) {
        //     return;
        // }
        // const address = import.meta.env.VITE_DAEMON_JRPC_ADDRESS || WALLET_JSON_RPC_ADDRESS; //Current host
        // const formData = new FormData();
        // formData.append('file', selectedFile);
        // console.info('handle file upload form data ', address, { formData });
        // fetch(`${address}/upload_template`, { method: 'POST', body: formData }).then((resp) => {
        //     console.info('resp', resp);
        // });
        // await uploadFile(address, formData);
    }, []);
    return (
        <div className="template">
            <Typography>{'Upload wasm file'}</Typography>
            <Typography>{`Path: ${selectedFilePath}`}</Typography>
            {/* <input type="file" onChange={handleFileSelect} /> */}
            {/* <button onClick={handleFileUpload}>Upload template</button> */}\
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
