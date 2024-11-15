import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconImage, MarkdownWrapper, Text, TextWrapper, Title, VersionWrapper, Wrapper } from './styles';
import { AccordionItem } from './AccordionItem/AccordionItem';
import tariIcon from './tari-icon.png';

const parseMarkdownSections = (markdown: string): ReleaseSection[] => {
    const parts = markdown.split(/\n---\n/);
    return parts.map((part) => {
        const lines = part.trim().split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();

        const paragraphStart = lines.findIndex((line, i) => i > 0 && line.trim() !== '');
        const date = paragraphStart > 0 ? lines[paragraphStart].trim().replace(/^_|_$/g, '') : '';

        const contentLines = [...lines];
        if (paragraphStart > 0) {
            contentLines.splice(paragraphStart, 1);
        }
        const content = contentLines.slice(1).join('\n').trim();

        return { title, date, content };
    });
};

interface ReleaseSection {
    title: string;
    date: string;
    content: string;
}

export const ReleaseNotes = () => {
    const [sections, setSections] = useState<ReleaseSection[]>([]);
    const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);

    useEffect(() => {
        const loadReleaseNotes = async () => {
            try {
                const response = await fetch('/ReleaseNotes.md');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                setSections(parseMarkdownSections(text));
            } catch (err) {
                console.error('Error loading release notes:', err);
            }
        };

        loadReleaseNotes();
    }, []);

    const toggleSection = (index: number) => {
        setOpenSectionIndex(openSectionIndex === index ? null : index);
    };

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
                {sections.map((section, index) => (
                    <AccordionItem
                        key={index}
                        title={section.title}
                        subtitle={section.date}
                        content={<ReactMarkdown>{section.content}</ReactMarkdown>}
                        isOpen={openSectionIndex === index}
                        onToggle={() => toggleSection(index)}
                    />
                ))}
            </MarkdownWrapper>
        </Wrapper>
    );
};
