import { useState } from 'react';
import Display from './components/Display.tsx';

const words = Array(25).fill('hiiii');
interface SeedWordsProps {
    seedwords?: string[];
}
export default function SeedWords({ seedwords = words }: SeedWordsProps) {
    const [isEditing, setIsEditing] = useState(false);
    return <Display words={seedwords} />;
}
