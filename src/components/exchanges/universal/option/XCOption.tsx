import { useState } from 'react';
import { ContentWrapper, Heading, Wrapper, XCContent } from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeContent } from '@app/types/exchange.ts';
import { AddressWrapper, ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';

interface XCOptionProps {
    content: Partial<ExchangeContent>;
    isCurrent?: boolean;
}
export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Wrapper $isCurrent={isCurrent}>
            <ContentWrapper>
                <XCContent>
                    {content.logo_img_url && (
                        <ImgWrapper $isLogo>
                            <img src={content.logo_img_url} alt={content.name} />
                        </ImgWrapper>
                    )}
                    <Heading>{content.name}</Heading>
                </XCContent>
                <OpenButton onClick={() => setOpen(!open)} $isOpen={open}>
                    <ImgWrapper $border>
                        <ChevronSVG />
                    </ImgWrapper>
                </OpenButton>
            </ContentWrapper>

            <AddressWrapper $isOpen={open} animate={{ height: open ? 'auto' : 0 }} initial={false}>
                <div>{`hi!`}</div>
            </AddressWrapper>
        </Wrapper>
    );
};
