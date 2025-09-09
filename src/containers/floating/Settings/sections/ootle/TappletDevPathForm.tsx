import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IoCopyOutline, IoCheckmarkOutline, IoCloseOutline, IoPencil, IoFolderOpen } from 'react-icons/io5';
import styled from 'styled-components';
import { Input } from '@app/components/elements/inputs/Input';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from './styles/styles.ts';
import { SettingsGroup, SettingsGroupContent } from '../../components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { open } from '@tauri-apps/plugin-dialog';

const DEFAULT_DEV_TAPP_PATH = '';
// eslint-disable-next-line no-useless-escape
const DEV_TAPP_PATH_REGEX = /^(https?:\/\/)?(localhost|127\.0\.0\.1):\d{1,6}$|^\/?[\w\-]+([\\/][\w\-]+)*$/;

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

    const handleDirSelect = useCallback(async () => {
        console.info('handle directory select');

        const dirPath = await open({
            title: 'Select Tapplet Directory',
            directory: true,
            multiple: false,
        });
        console.info('handle directory select', dirPath);

        // The open function returns null if user cancelled the dialog
        if (dirPath === null) {
            console.info('Directory selection canceled');
            return;
        }

        console.info('Selected directory path:', dirPath);

        setValue('tappPath', dirPath, { shouldDirty: true });
        addDevTapp(dirPath);

        // Reset to default value after successful addition
        setValue('tappPath', DEFAULT_DEV_TAPP_PATH);
    }, [addDevTapp, setValue]);

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
                                rules={{
                                    pattern: {
                                        value: DEV_TAPP_PATH_REGEX,
                                        message: 'Invalid endpoint format',
                                    },
                                }}
                                render={({ field }) => {
                                    return (
                                        <StyledInput
                                            {...field}
                                            type="text"
                                            placeholder="Path (eg. /home/user/tapplet/dist) OR endpoint (eg. http://localhost:18000)"
                                            hasError={!!errors.tappPath}
                                            onFocus={() => setEditing(true)}
                                            onBlur={() => setEditing(false)}
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
                                <>
                                    <IconButton type="button" size="small" onClick={handleDirSelect}>
                                        <IoFolderOpen />
                                    </IconButton>
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
                                </>
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
