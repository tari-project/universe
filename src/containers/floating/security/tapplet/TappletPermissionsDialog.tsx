import { useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, CTAWrapper, Header, Subtitle, Title, Wrapper } from '../common.styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { TextWrapper } from '@app/components/sync/styles.ts';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export default function TappletPermissionsDialog() {
    const { t } = useTranslation('staged-security');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const setTappletPermissions = useSecurityStore((s) => s.setTappletPermissions);
    const tappletPermissions = useSecurityStore((s) => s.tappletPermissions);

    const isOpen = modal === 'tapplet_permissions';

    function handleClose() {
        void emit('tapplet-dialog-response', undefined);
        setModal(null);
        setTappletPermissions('');
    }

    function handleSubmit() {
        emit('tapplet-dialog-response', tappletPermissions).finally(() => {
            setModal(null);
            setTappletPermissions('');
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
                        <Title>{'Grant Tari Permissions'}</Title>
                        <Subtitle>{'Your tapplet asks for some permissions. Do you agree?'}</Subtitle>
                        <ContentWrapper>
                            <TextWrapper>{tappletPermissions}</TextWrapper>
                        </ContentWrapper>

                        <CTAWrapper>
                            <Button
                                onClick={handleSubmit}
                                variant="black"
                                fluid
                                size="xlarge"
                                disabled={!tappletPermissions}
                                type="submit"
                            >
                                {t('Allow Tapplet Tari Permissions')}
                            </Button>
                            <TextButton color="greyscale" onClick={handleClose}>
                                {'Reject Tapplet Tari Permissions'}
                            </TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
