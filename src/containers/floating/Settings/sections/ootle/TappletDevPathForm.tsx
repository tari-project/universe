import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IoCopyOutline, IoCheckmarkOutline, IoCloseOutline, IoPencil } from 'react-icons/io5';
import styled from 'styled-components';
import { Input } from '@app/components/elements/inputs/Input';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from '../wallet/styles.ts';
import { SettingsGroup, SettingsGroupContent } from '../../components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';

const DEFAULT_DEV_TAPP_PATH = '';

const StyledInput = styled(Input)`
    font-size: 12px;
`;

const StyledForm = styled.form`
    width: 100%;
    // Reserve space for error message
    min-height: 60px;
`;

const TappletDevPathForm = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const {
        control,
        watch,
        handleSubmit,
        setValue,
        setFocus,
        reset,
        trigger,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: { tappPath: DEFAULT_DEV_TAPP_PATH },
    });
    const [editing, setEditing] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const address = watch('tappPath');

    const addDevTapp = useTappletsStore((s) => s.addDevTapp);

    function handleEditClick() {
        setFocus('tappPath', { shouldSelect: true });
        setEditing(true);
    }
    useEffect(() => {
        setValue('tappPath', DEFAULT_DEV_TAPP_PATH);
    }, [setValue]);

    const handleApply = useCallback(
        async (data: { tappPath: string }) => {
            addDevTapp(data.tappPath);
            setEditing(false);
        },
        [addDevTapp]
    );

    const handleReset = useCallback(() => {
        reset({ tappPath: DEFAULT_DEV_TAPP_PATH });
        setEditing(false);
    }, [reset]);

    useEffect(() => {
        trigger('tappPath');
    }, [trigger]);

    const editIconMarkup = !editing ? (
        <IconButton size="small" onClick={() => handleEditClick()} type="button">
            <IoPencil />
        </IconButton>
    ) : null;

    return (
        <SettingsGroup>
            <SettingsGroupContent>
                <Typography variant="h6">{t('Dev Tapplet Path')}</Typography>
                <StyledForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
                    <WalletSettingsGrid>
                        <InputArea>
                            <Controller
                                name="tappPath"
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <StyledInput
                                            {...field}
                                            type="text"
                                            placeholder="Dev Tapplet build path, e.g.: /home/user/tapplet/dist"
                                            hasError={!!errors.tappPath}
                                            onFocus={() => setEditing(true)}
                                        />
                                    );
                                }}
                            />
                        </InputArea>
                        <CTASArea>
                            {editIconMarkup}
                            {editing ? (
                                <>
                                    <IconButton type="submit" size="small" disabled={!isDirty || !!errors.tappPath}>
                                        <IoCheckmarkOutline />
                                    </IconButton>
                                    <IconButton type="reset" size="small">
                                        <IoCloseOutline />
                                    </IconButton>
                                </>
                            ) : (
                                <IconButton
                                    size="small"
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        copyToClipboard(address);
                                    }}
                                >
                                    {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                                </IconButton>
                            )}
                        </CTASArea>
                    </WalletSettingsGrid>

                    {errors.tappPath && (
                        <span style={{ color: 'red', fontSize: '12px' }}>{errors.tappPath.message}</span>
                    )}
                </StyledForm>
            </SettingsGroupContent>
        </SettingsGroup>
    );
};

export default TappletDevPathForm;
