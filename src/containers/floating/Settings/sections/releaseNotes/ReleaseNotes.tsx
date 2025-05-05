import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconImage, MarkdownWrapper, Text, TextWrapper, Title, UpgradeButton, VersionWrapper, Wrapper } from './styles';
import { AccordionItem } from './AccordionItem/AccordionItem';
import tariIcon from './tari-icon.png';
import packageInfo from '../../../../../../package.json';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store';
import { isMainNet } from '@app/utils/network';

const appVersion = packageInfo.version;
const versionString = `v${appVersion}`;

const parseMarkdownSections = (markdown: string): ReleaseSection[] => {
    if (markdown === '' || !markdown) {
        return [];
    }

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

interface Props {
    noHeader?: boolean;
    showScrollBars?: boolean;
}

export const ReleaseNotes = ({ noHeader, showScrollBars }: Props) => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const releaseNotes = useAppStateStore((state) => state.releaseNotes);
    const network = useMiningStore((state) => state.network);
    const needsUpgrade = useAppStateStore((state) => state.isAppUpdateAvailable);
    const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(0);

    const sections = useMemo(() => parseMarkdownSections(releaseNotes), [releaseNotes]);

    const toggleSection = (index: number) => {
        setOpenSectionIndex(openSectionIndex === index ? null : index);
    };

    const handleUpdate = useCallback(async () => {
        invoke('proceed_with_update', { force: true }).catch((err) => {
            console.error('Error updating:', err);
        });
    }, []);

    return (
        <Wrapper>
            {!noHeader && (
                <VersionWrapper>
                    <IconImage src={tariIcon} alt="Tari Icon" />
                    <TextWrapper>
                        <Title>{t('settings:tabs.releaseNotes')}</Title>
                        <Text>
                            {t('tari-universe')} - {!isMainNet(network) && t('testnet')} {versionString}
                        </Text>
                    </TextWrapper>

                    {needsUpgrade && (
                        <UpgradeButton onClick={handleUpdate}>
                            {t('settings:release-notes.upgrade-available')}
                        </UpgradeButton>
                    )}
                </VersionWrapper>
            )}

            <MarkdownWrapper $showScrollBars={showScrollBars}>
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
