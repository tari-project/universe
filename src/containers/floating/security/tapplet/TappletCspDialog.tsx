import { useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, CTAWrapper, Header, Subtitle, Title, Wrapper } from '../common.styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { TextWrapper } from '@app/components/sync/styles.ts';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

function extractCspDirectives(csp: string): string[] {
    if (!csp) return [];
    return csp
        .split(';')
        .map((directive) => directive.trim())
        .filter((directive) => directive.length > 0);
}

export default function TappletCspDialog() {
    const { t } = useTranslation('staged-security');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const setTappletCsp = useSecurityStore((s) => s.setTappletCsp);
    const csp = useSecurityStore((s) => s.tappletCsp);
    const cspList = extractCspDirectives(csp);

    const isOpen = modal === 'tapplet_csp';

    function handleClose() {
        void emit('tapplet-dialog-response', { response: '' });
        setModal(null);
        setTappletCsp('');
    }

    function handleSubmit() {
        emit('tapplet-dialog-response', { response: csp }).finally(() => {
            setModal(null);
            setTappletCsp('');
        });
    }

    // TODO add translations, designs and style
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <Content>
                        <Title>{'Grant CSP Permissions'}</Title>
                        <Subtitle>{'Your tapplet asks for some permissions. Do you agree?'}</Subtitle>

                        <ContentWrapper>
                            <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                                {cspList.map((directive, index) => (
                                    <li key={index}>{directive}</li>
                                ))}
                            </ul>
                        </ContentWrapper>
                        <CTAWrapper>
                            <Button
                                onClick={handleSubmit}
                                variant="black"
                                fluid
                                size="xlarge"
                                disabled={!csp}
                                type="submit"
                            >
                                {t('Allow Tapplet CSP')}
                            </Button>
                            <TextButton color="greyscale" onClick={handleClose}>
                                {'Reject Tapplet CSP'}
                            </TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
