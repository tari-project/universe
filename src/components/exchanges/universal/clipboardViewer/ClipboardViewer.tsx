import React, { useState, useEffect } from 'react';

export const ClipboardViewer: React.FC = () => {
    const [clipboardText, setClipboardText] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const readClipboard = async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    setClipboardText(text);
                    setError('');
                } else {
                    setError('Clipboard API not supported');
                }
            } catch (err) {
                setError('Unable to read clipboard');
            }
        };

        readClipboard();

        // Poll clipboard every 1 second to check for changes
        const interval = setInterval(readClipboard, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                width: '100%',
            }}
        >
            <img
                src="/assets/img/copy-clipboard.svg"
                alt="Clipboard"
                style={{
                    width: '24px',
                    height: '24px',
                    color: '#3b82f6',
                    flexShrink: 0,
                }}
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <h3
                    style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#111827',
                        marginBottom: '8px',
                    }}
                >
                    Current Clipboard
                </h3>
                <div style={{ flex: 1 }}>
                    {error ? (
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#ef4444',
                            }}
                        >
                            {error}
                        </p>
                    ) : (
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#374151',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {clipboardText || 'Clipboard is empty'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClipboardViewer;
