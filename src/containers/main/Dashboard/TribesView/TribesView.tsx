import { useTranslation } from 'react-i18next';
import VisualMode from '../components/VisualMode';

function TribesView() {
    const { t } = useTranslation('tribes-view', { useSuspense: false });

    return (
        <>
            <div>{t('title')}</div>
            <VisualMode />
        </>
    );
}

export default TribesView;
