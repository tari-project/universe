import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { useUIStore } from '@app/store/useUIStore';
import { setShowBatteryAlert } from '@app/store/actions/uiStoreActions';
import batteryEmoji from '/assets/img/icons/emoji/battery.png';
import yatHighVoltageEmoji from '/assets/img/icons/emoji/yat_high_voltage.png';

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wrapper,
    ContentWrapper,
    IconWrapper,
    BatteryIcon,
    Title,
    Description,
    InfoBox,
    InfoIcon,
    InfoLabel,
    ActionButton,
} from './styles';

const BatteryAlertDialog = memo(function BatteryAlertDialog() {
    const { t } = useTranslation(['components'], { useSuspense: false });
    const isOpen = useUIStore((s) => s.showBatteryAlert);

    const handleClose = useCallback(() => {
        setShowBatteryAlert(false);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <IconWrapper>
                        <BatteryIcon>
                            <img src={batteryEmoji} alt="Battery emoji" height={84} />
                        </BatteryIcon>
                    </IconWrapper>

                    <ContentWrapper>
                        <Title>{t('battery-alert-dialog.title')}</Title>
                        <Description>{t('battery-alert-dialog.description')}</Description>

                        <InfoBox>
                            <InfoIcon>
                                <img src={yatHighVoltageEmoji} alt="High voltage emoji" height={32} />
                            </InfoIcon>
                            <InfoLabel>{t('battery-alert-dialog.auto-resume-info')}</InfoLabel>
                        </InfoBox>

                        <ActionButton onClick={handleClose}>
                            <span>{t('battery-alert-dialog.understood')}</span>
                        </ActionButton>
                    </ContentWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default BatteryAlertDialog;
