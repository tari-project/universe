import { modeType } from '@app/store/types';
import { TileItem } from '../styles';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useChangeMiningMode } from '@app/hooks/mining/useMiningControls';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Select } from '@app/components/elements/inputs/Select.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });
    const mode = useAppStatusStore((s) => s.mode);

    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const changeMode = useChangeMiningMode();

    const handleChange = (value: string) => {
        changeMode(value as modeType);
    };

    return (
        <TileItem>
            <Typography>{t('mode')}</Typography>
            <Select
                disabled={isChangingMode}
                loading={isChangingMode}
                onChange={handleChange}
                selectedValue={mode}
                options={[
                    { label: 'ECO', value: 'Eco', iconSrc: eco },
                    { label: 'Ludicrous', value: 'Ludicrous', iconSrc: fire },
                ]}
            />
        </TileItem>
    );
}

export default ModeSelect;
