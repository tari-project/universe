import { useTranslation } from 'react-i18next';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';
import { useTransactionNote } from '@app/hooks/wallet/useTransactionNote.ts';
import { NoteSection, NoteLabel } from './styles.ts';

interface TransactionNoteProps {
    transactionId: number;
}

export const TransactionNote = ({ transactionId }: TransactionNoteProps) => {
    const { t } = useTranslation('wallet');
    const [note, saveNote] = useTransactionNote(transactionId);

    return (
        <NoteSection>
            <NoteLabel>{t('details.note')}</NoteLabel>
            <TextArea
                value={note}
                onChange={(e) => saveNote(e.target.value)}
                placeholder={t('details.note-placeholder')}
                rows={3}
                data-testid="tx-details-note"
            />
        </NoteSection>
    );
};
