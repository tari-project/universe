// import { useTranslation } from 'react-i18next';
import { CTAWrapper, TextWrapper } from './styles.ts';
import { CTA } from '../styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function CreateComplete({ onClose }: { onClose?: () => void }) {
    // const { t } = useTranslation('wallet');
    return (
        <>
            <TextWrapper>
                <Typography variant="h5">{`You’re all done!`}</Typography>
                <Typography variant="p">{`Your wallet is now securely backed up—great job!\nYour Tari tokens are safe and ready whenever you need them, even if you switch or lose your device.`}</Typography>
                <Typography variant="p">{`Happy mining!`}</Typography>

                <CTAWrapper>
                    <CTA size="xlarge" type="button" onClick={onClose}>
                        {`Continue to Tari Universe`}
                    </CTA>
                </CTAWrapper>
            </TextWrapper>
        </>
    );
}
