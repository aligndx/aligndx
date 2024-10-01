'use client';

import { useCallback, useState } from 'react';

interface ReturnType {
    value: boolean;
    onTrue: () => void;
    onFalse: () => void;
    onToggle: () => void;
    setValue: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoolean(defaultValue?: boolean, onToggleCallback?: (value: boolean) => void): ReturnType {
    const [value, setValue] = useState(!!defaultValue);

    const onTrue = useCallback(() => {
        setValue(true);
    }, []);

    const onFalse = useCallback(() => {
        setValue(false);
    }, []);

    const onToggle = useCallback(() => {
        const newValue = !value;
        setValue(newValue);

        if (onToggleCallback) {
            onToggleCallback(newValue);
        }
    }, [value, onToggleCallback]);

    return {
        value,
        onTrue,
        onFalse,
        onToggle,
        setValue,
    };
}
