'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

type FormColorSelectProps = {
    name: string;
    label: string;
    description?: string;
};

export default function FormColorSelect({ name, label, description }: FormColorSelectProps) {
    const { control } = useFormContext();
    const [open, setOpen] = useState(false);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormDescription>{description}</FormDescription>
                    <FormControl>
                        <Popover onOpenChange={setOpen} open={open}>
                            <PopoverTrigger asChild>
                                <Button
                                    className="w-full"
                                    onClick={() => setOpen(true)}
                                    size="icon"
                                    style={{
                                        backgroundColor: field.value || '#FFFFFF',
                                    }}
                                    variant="outline"
                                />
                            </PopoverTrigger>
                            <PopoverContent className="flex flex-col gap-4 w-full">
                                <HexColorPicker
                                    color={field.value || '#FFFFFF'}
                                    onChange={field.onChange}
                                />
                                <Input
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.currentTarget.value)}
                                />
                            </PopoverContent>
                        </Popover>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
