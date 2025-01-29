import { ChangeEvent, useState } from 'react';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';

function TemplateFileUploader() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        console.info('handle file change');
        const file = event.target.files?.item(0);
        console.info('handle file', file);
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleFileUpload = () => {
        console.info('handle file upload ', selectedFile);
        if (!selectedFile) {
            return;
        }
        const address = import.meta.env.VITE_DAEMON_JRPC_ADDRESS || ''; //Current host
        const formData = new FormData();
        formData.append('file', selectedFile);
        console.info('handle file upload form data ', address, { formData });
        // fetch(`${address}/upload_template`, { method: 'POST', body: formData }).then((resp) => {
        //     console.info('resp', resp);
        // });
    };
    return (
        <div className="template">
            <Typography>{'Upload wasm file'}</Typography>
            <input type="file" onChange={handleFileChange} />
            {/* <button onClick={handleFileUpload}>Upload template</button> */}
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
