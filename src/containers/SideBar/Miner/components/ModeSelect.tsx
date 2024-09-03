import { modeType } from '@app/store/types';
import { TileItem } from '../styles';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Select } from '@app/components/elements/Select.tsx';

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });

    const mode = useAppStatusStore((s) => s.mode);
    const { changeMode, isChangingMode } = useMiningControls();

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
                    { label: '♻️ ECO', value: 'Eco', selectedLabel: 'ECO ♻️' },
                    { label: '🔥 Ludicrous', value: 'Ludicrous', selectedLabel: 'Ludicrous 🔥' },
                ]}
            />
        </TileItem>
    );
}

export default ModeSelect;
