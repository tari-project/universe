import { Heading, Wrapper } from '@app/components/exchanges/universal/option/styles.ts';
import { ReactNode } from 'react';

interface XCOptionProps {
    title: string;
    logoImg?: ReactNode;
    isCurrent?: boolean;
}
export const XCOption = ({ title, logoImg, isCurrent = false }: XCOptionProps) => {
    return (
        <Wrapper $isCurrent={isCurrent}>
            <Heading>{title}</Heading>
        </Wrapper>
    );
};
