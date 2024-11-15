import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconImage, MarkdownWrapper, Text, TextWrapper, Title, VersionWrapper, Wrapper } from './styles';
import tariIcon from './tari-icon.png';

export const ReleaseNotes = () => {
    const [content, setContent] = useState('');

    const loadReleaseNotes = async () => {
        try {
            const response = await fetch('/ReleaseNotes.md');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            setContent(text);
        } catch (err) {
            console.error('Error loading release notes:', err);
        }
    };

    useEffect(() => {
        loadReleaseNotes();
    }, []);

    return (
        <Wrapper>
            <VersionWrapper>
                <IconImage src={tariIcon} alt="Tari Icon" />
                <TextWrapper>
                    <Title>Release Notes</Title>
                    <Text>Tari Universe - Testnet V0.6.4</Text>
                </TextWrapper>
            </VersionWrapper>
            <MarkdownWrapper>
                <ReactMarkdown>{content}</ReactMarkdown>
            </MarkdownWrapper>
        </Wrapper>
    );
};
