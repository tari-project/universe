import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { EditWrapper, Form, StyledTextArea } from '@app/components/wallet/seedwords/components/edit.styles.ts';

interface EditProps {
    onEditClick: (editing: boolean) => void;
}
export const Edit = ({ onEditClick }: EditProps) => {
    const { t } = useTranslation('settings', { useSuspense: false });
    return (
        <EditWrapper>
            <Typography>{t('action-requires-restart')}</Typography>
            <Form>
                <StyledTextArea $hasError={false} />
            </Form>
        </EditWrapper>
    );
};
