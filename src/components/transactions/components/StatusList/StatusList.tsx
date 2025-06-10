import { ReactNode } from 'react';
import { Wrapper, Entry, Label, Value, ValueRight, ExternalLink, ValueLeft } from './styles';
import { SendStatus } from '../../send/SendModal';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import { open } from '@tauri-apps/plugin-shell';

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
                .map(({ label, value, valueRight, status, externalLink }, index) => (
                    <Entry key={index}>
                        <Label>{label}</Label>
                        <Value $status={status}>
                            {!externalLink ? (
                                <ValueLeft>{value}</ValueLeft>
                            ) : (
                                <ExternalLink onClick={() => open(externalLink)}>
                                    {value} <ExternalLinkIcon />
                                </ExternalLink>
                            )}
                            {valueRight !== undefined && valueRight !== null && <ValueRight>{valueRight}</ValueRight>}
                        </Value>
                    </Entry>
                ))}
        </Wrapper>
    );
}
