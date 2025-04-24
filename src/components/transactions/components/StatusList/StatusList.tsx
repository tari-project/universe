import { ReactNode } from 'react';
import { Wrapper, Entry, Label, Value, ValueRight, ExternalLink } from './styles';
import { SendStatus } from '../../send/SendModal';
import ExternalLinkIcon from './icons/ExternalLinkIcon';

export interface StatusListEntry {
    label: string;
    value: ReactNode;
    valueRight?: ReactNode;
    status?: SendStatus;
    helpText?: string;
    externalLink?: string;
}

interface Props {
    entries: StatusListEntry[];
}

export function StatusList({ entries }: Props) {
    return (
        <Wrapper>
            {entries
                .filter((entry) => Boolean(entry.value))
                .map(({ label, value, valueRight, status, helpText, externalLink }, index) => (
                    <Entry key={index}>
                        <Label>{label}</Label>
                        <Value $status={status}>
                            {!externalLink ? (
                                value
                            ) : (
                                <ExternalLink href={externalLink}>
                                    {value} <ExternalLinkIcon />
                                </ExternalLink>
                            )}
                            {valueRight && <ValueRight>{valueRight}</ValueRight>}
                        </Value>
                    </Entry>
                ))}
        </Wrapper>
    );
}
