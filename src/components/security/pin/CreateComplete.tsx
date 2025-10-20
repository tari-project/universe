import { useTranslation } from 'react-i18next';
import { CTAWrapper, TextWrapper } from './styles.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export default function CreateComplete({ onClose }: { onClose?: () => void }) {
    const { t } = useTranslation('staged-security');
    return (
        <>
            <TextWrapper>
                <Typography variant="h5">{t('common.all-done')}</Typography>
                <Typography variant="p">{t('complete.secured')}</Typography>
                <Typography variant="p">{t('complete.happy-mining')}</Typography>

                <CTAWrapper>
                    <Button variant="black" size="xlarge" type="button" onClick={onClose}>
                        {t('complete.continue')}
                    </Button>
                </CTAWrapper>
            </TextWrapper>
        </>
    );
}
