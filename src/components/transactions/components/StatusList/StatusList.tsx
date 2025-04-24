import { ReactNode } from 'react';
import { Wrapper, Entry, Label, Value, ValueRight } from './styles';
import { SendStatus } from '../../send/SendModal';

export interface StatusListEntry {
    label: string;
    value: ReactNode;
    valueRight?: ReactNode;
    status?: SendStatus;
    condition?: boolean;
}

interface Props {
    entries: StatusListEntry[];
}

export function StatusList({ entries }: Props) {
    return (
        <Wrapper>
            {entries
                .filter((entry) => Boolean(entry.value))
                .map((entry, index) => (
                    <Entry key={index}>
                        <Label>{entry.label}</Label>
                        <Value $status={entry.status}>
                            {entry.value}
                            {entry.valueRight && <ValueRight>{entry.valueRight}</ValueRight>}
                        </Value>
                    </Entry>
                ))}
        </Wrapper>
    );
}
