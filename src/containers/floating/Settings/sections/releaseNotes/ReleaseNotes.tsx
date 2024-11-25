import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    IconImage,
    LoadingText,
    MarkdownWrapper,
    Text,
    TextWrapper,
    Title,
    UpgradeButton,
    VersionWrapper,
    Wrapper,
} from './styles';
import { AccordionItem } from './AccordionItem/AccordionItem';
import tariIcon from './tari-icon.png';
import packageInfo from '../../../../../../package.json';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore';
import { checkUpdate } from '@tauri-apps/api/updater';

const environment = import.meta.env.MODE;
const appVersion = packageInfo.version;
const versionString = `v${appVersion}`;
const CHANGELOG_URL =
    environment === 'development'
        ? 'https://cdn.jsdelivr.net/gh/tari-project/universe@a5802cbf819e0e1a00cb83a2b354b09def25752e/CHANGELOG.md'
        : `https://cdn.jsdelivr.net/gh/tari-project/universe@main/CHANGELOG.md`;

const parseMarkdownSections = (markdown: string): ReleaseSection[] => {
    const sections = markdown.split(/\n---\n/);

    return sections.map((block) => {
        const lines = block.trim().split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();

        const dateLine = lines.find((line, index) => index > 0 && line.trim().match(/^_.*_$/));
        const date = dateLine?.replace(/^_|_$/g, '').trim() || '';

        const contentStartIndex = lines.findIndex((line) => line === dateLine) + 1;
        const content = lines.slice(contentStartIndex).join('\n').trim();

        return { title, date, content };
    });
};

interface ReleaseSection {
    title: string;
    date: string;
    content: string;
}

export const ReleaseNotes = () => {
    const { setDialogToShow } = useUIStore();
    const [sections, setSections] = useState<ReleaseSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);
    const [needsUpgrade, setNeedsUpgrade] = useState(false);

    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    useEffect(() => {
        const loadReleaseNotes = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(CHANGELOG_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                const parsedSections = parseMarkdownSections(text);
                setSections(parsedSections);
            } catch (err) {
                console.error('Error loading release notes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadReleaseNotes();
    }, []);

    useEffect(() => {
        const checkForUpdates = async () => {
            const { shouldUpdate } = await checkUpdate();
            setNeedsUpgrade(shouldUpdate);
        };

        checkForUpdates();
    }, []);

    const toggleSection = (index: number) => {
        setOpenSectionIndex(openSectionIndex === index ? null : index);
    };

    return (
        <Wrapper>
            <VersionWrapper>
                <IconImage src={tariIcon} alt="Tari Icon" />
                <TextWrapper>
                    <Title>{t('settings:tabs.releaseNotes')}</Title>
                    <Text>
                        {t('tari-universe')} - {t('testnet')} {versionString}
                    </Text>
                </TextWrapper>

                {needsUpgrade && !isLoading && (
                    <UpgradeButton onClick={() => setDialogToShow('autoUpdate')}>⚠️ Upgrade Available</UpgradeButton>
                )}
            </VersionWrapper>

            <MarkdownWrapper>
                {isLoading ? (
                    <LoadingText>Loading Release Notes...</LoadingText>
                ) : (
                    sections.map((section, index) => (
                        <AccordionItem
                            key={index}
                            title={section.title}
                            subtitle={section.date}
                            content={<ReactMarkdown>{section.content}</ReactMarkdown>}
                            isOpen={openSectionIndex === index}
                            onToggle={() => toggleSection(index)}
                        />
                    ))
                )}
            </MarkdownWrapper>
        </Wrapper>
    );
};
