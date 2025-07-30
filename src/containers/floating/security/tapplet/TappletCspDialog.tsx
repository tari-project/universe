import { useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { CTAWrapper, Header, Wrapper } from '../common.styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { TextWrapper } from '@app/components/sync/styles.ts';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

function extractCspDirectives(csp: string): string[] {
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
    const tappletCsp = useSecurityStore((s) => s.tappletCsp);
    const tappletCspList = extractCspDirectives(tappletCsp);

    const isOpen = modal === 'allow_tapplet_csp';

    function handleClose() {
        void emit('tapplet-csp-dialog-response', { csp: '' });
        setModal(null);
        setTappletCsp('');
    }

    function handleSubmit() {
        emit('tapplet-csp-dialog-response', { csp: tappletCsp }).finally(() => {
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
                    <TextWrapper>
                        <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                            {tappletCspList.map((directive, index) => (
                                <li key={index}>{directive}</li>
                            ))}
                        </ul>
                    </TextWrapper>
                </Wrapper>
                <Wrapper>
                    <CTAWrapper>
                        <Button
                            onClick={handleSubmit}
                            variant="black"
                            fluid
                            size="xlarge"
                            disabled={!tappletCsp}
                            type="submit"
                        >
                            {t('Allow Tapplet CSP')}
                        </Button>
                        <TextButton color="greyscale" onClick={handleClose}>
                            {'Reject Tapplet CSP'}
                        </TextButton>
                    </CTAWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
