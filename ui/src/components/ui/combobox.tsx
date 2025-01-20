"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandSeparator,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerDescription,
    DrawerTitle,
} from "@/components/ui/drawer";
import { CaretUpDown, CheckBoxIcon, CheckBoxOutlineBlankIcon, CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ComboboxProps<T> {
    items: T[]; // List of items to display
    value?: T[]; // For controlled usage
    onChange?: (value: T[]) => void;
    multiple?: boolean;
    disabled?: boolean;
    limit?: number; // Limit visible items for performance
    // Optionally allow customization of item label, etc.
    itemToString?: (item: T) => string;
    title?: string;
    description?: string;
    label?: string;
    searchPlaceholder?: string;
}

export function Combobox<T extends { id: string; name: string }>({
    items,
    value: controlledValue,
    onChange,
    multiple = true,
    disabled = false,
    limit,
    itemToString = (item) => item.name,
    title = "Select Item(s)",
    description = "",
    label = "",
    searchPlaceholder = "Search...",
}: ComboboxProps<T>) {
    const [internalValue, setInternalValue] = React.useState<T[]>([]);
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const isMobile = useMediaQuery("md", "down");

    // Controlled vs uncontrolled value
    const selectedItems = controlledValue !== undefined ? controlledValue : internalValue;

    // Handle selection changes
    const handleChange = (item: T) => {
        let newValue: T[];
        if (multiple) {
            const isSelected = selectedItems.some((val) => val.id === item.id);
            newValue = isSelected
                ? selectedItems.filter((val) => val.id !== item.id)
                : [...selectedItems, item];
        } else {
            newValue = selectedItems.some((val) => val.id === item.id) ? [] : [item];
        }

        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    const handleSelectAll = () => {
        if (onChange) {
            onChange(items);
        } else {
            setInternalValue(items);
        }
    };

    const handleClearAll = () => {
        if (onChange) {
            onChange([]);
        } else {
            setInternalValue([]);
        }
    };

    // Filter and sort items: Show selected first
    const filteredItems = items
        .sort((a, b) => {
            const aSelected = selectedItems.some((s) => s.id === a.id);
            const bSelected = selectedItems.some((s) => s.id === b.id);
            if (aSelected === bSelected) return 0;
            return aSelected ? -1 : 1;
        })
        .slice(0, limit ?? items.length);

    const DropdownContent = () => (
        <Command>
            <div className="flex flex-row items-center justify-between p-2">
                <Button
                    className="flex items-center gap-2"
                    onClick={handleSelectAll}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                >
                    <CheckBoxIcon />
                    Select All
                </Button>
                <Button
                    className="flex items-center gap-2"
                    onClick={handleClearAll}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                >
                    <CheckBoxOutlineBlankIcon />
                    Clear All
                </Button>
            </div>
            <CommandSeparator />
            <CommandInput
                placeholder={searchPlaceholder}
                className="h-9"
                disabled={disabled}
            />
            <CommandList>
                {filteredItems.length === 0 ? (
                    <CommandEmpty>No items found</CommandEmpty>
                ) : (
                    <CommandGroup>
                        {filteredItems.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={itemToString(item)}
                                onSelect={() => handleChange(item)}
                                disabled={disabled}
                            >
                                {itemToString(item)}
                                <CheckIcon
                                    className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedItems.some((val) => val.id === item.id)
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </Command>
    );

    const ButtonContent = React.forwardRef<HTMLButtonElement, {}>((props, ref) => (
        <Button
            ref={ref}
            variant="outline"
            role="combobox"
            className="justify-between"
            disabled={disabled}
            {...props}
        >
            {selectedItems.length > 1 ? (
                <Badge>{selectedItems.length} selected</Badge>
            ) : selectedItems.length === 1 ? (
                itemToString(selectedItems[0])
            ) : (
                `${title}`
            )}
            <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
    ));

    ButtonContent.displayName = "combobox-trigger"

    return (
        <>
            {isMobile ? (
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <div className="flex flex-col gap-2">
                        <Label>{label}</Label>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                        <DrawerTrigger asChild>
                            <ButtonContent />
                        </DrawerTrigger>
                    </div>
                    <DrawerContent>
                        <div className="flex flex-col gap-4 p-4">
                            <DrawerTitle>{title}</DrawerTitle>
                            {description && <DrawerDescription>{description}</DrawerDescription>}
                        </div>
                        <DropdownContent />
                    </DrawerContent>
                </Drawer>
            ) : (
                <Popover>
                    <div className="flex flex-col gap-2">
                        <Label>{label}</Label>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                        <PopoverTrigger asChild>
                            <ButtonContent />
                        </PopoverTrigger>
                    </div>
                    <PopoverContent className="p-0" align="start">
                        <DropdownContent />
                    </PopoverContent>
                </Popover>
            )}
        </>
    );
}
