import { Logo, Wrapper } from './styles.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';

interface LogoItem {
    src: string;
    name: string;
    colour?: string;
}
interface LogosProps {
    exchanges: ExchangeBranding[];
    variant?: 'primary' | 'mini';
    maxItems?: number;
}
export function Logos({ exchanges, variant = 'primary', maxItems = 3 }: LogosProps) {
    const items = exchanges
        ?.filter((x) => x.id !== 'universal')
        ?.slice(0, maxItems)
        ?.map(
            (x) =>
                ({
                    name: x.name,
                    src: x.logo_img_small_url || x.logo_img_url,
                    colour: x.primary_colour,
                }) as LogoItem
        );
    return !items?.length ? null : (
        <Wrapper $variant={variant}>
            {items?.map(({ src, name, colour }, i) =>
                src ? (
                    <Logo $variant={variant} key={name} $index={i} $bgColour={colour}>
                        <img src={src} alt={name} />
                    </Logo>
                ) : null
            )}
        </Wrapper>
    );
}
