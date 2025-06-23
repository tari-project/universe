import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import { LoadingWrapper } from './styles';

export default function LoadingButton() {
    return (
        <LoadingWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingDots />
        </LoadingWrapper>
    );
}
