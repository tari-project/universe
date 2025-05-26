import { useState } from 'react';
import { Heading, Wrapper } from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeContent } from '@app/types/exchange.ts';
import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';

interface XCOptionProps {
    content: Partial<ExchangeContent>;
    isCurrent?: boolean;
}
export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const [open, setOpen] = useState(false);
    return (
        <Wrapper $isCurrent={isCurrent}>
            {content.logo_img_url && (
                <ImgWrapper $isLogo>
                    <img src={content.logo_img_url} alt={content.name} />
                </ImgWrapper>
            )}
            <Heading>{content.name}</Heading>
            <OpenButton onClick={() => setOpen(!open)} $isOpen={open}>
                <ImgWrapper $border>
                    <ChevronSVG />
                </ImgWrapper>
            </OpenButton>
        </Wrapper>
    );
};
