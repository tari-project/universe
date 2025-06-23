import LoadingDots from '@app/components/elements/loaders/LoadingDots';
import { LoadingWrapper } from './styles';

export default function LoadingButton() {
    return (
        <LoadingWrapper>
            <LoadingDots />
        </LoadingWrapper>
    );
}
