"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandSeparator,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CaretUpDown, CheckIcon } from "@/components/icons"
import { Badge } from "@/components/ui/badge" // Import the Badge component from shadcn/ui
import { useApiService } from "@/services/api"
import { Submission } from "@/types/submission"

interface SubmissionSelectorProps {
    value?: Submission[];
    onChange?: (value: Submission[]) => void;
    multiple?: boolean; // Whether multiple selections are allowed
}

export function SubmissionSelector({
    value: controlledValue = [],
    onChange,
    multiple = true, // Default to allow multiple selection
}: SubmissionSelectorProps) {
    const [internalValue, setInternalValue] = React.useState<Submission[]>([])

    const value = controlledValue.length ? controlledValue : internalValue

    const { submissions } = useApiService()
    const { data, isLoading } = submissions.getSubmissionsQuery

    const handleChange = (newSubmission: Submission) => {
        let newValue: Submission[]

        if (multiple) {
            const isSelected = value.some((val) => val.id === newSubmission.id)
            newValue = isSelected
                ? value.filter((val) => val.id !== newSubmission.id)
                : [...value, newSubmission]
        } else {
            newValue = value.some((val) => val.id === newSubmission.id)
                ? []
                : [newSubmission]
        }

        if (onChange) {
            onChange(newValue)
        } else {
            setInternalValue(newValue)
        }
    }

    // Select All functionality
    const handleSelectAll = () => {
        if (onChange) {
            onChange(data || [])
        } else {
            setInternalValue(data || [])
        }
    }

    // Clear All functionality
    const handleClearAll = () => {
        if (onChange) {
            onChange([])
        } else {
            setInternalValue([])
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-4">
                    <h1>Source</h1>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-[200px] justify-between"
                    >
                        {/* If more than 1 item is selected, show the badge, otherwise show the selected name */}
                        {value.length > 1 ? (
                            <Badge>{value.length} selected</Badge>
                        ) : value.length === 1 ? (
                            value[0].name
                        ) : (
                            "Select submissions..."
                        )}
                        <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    {/* Non-searchable options */}
                    <div className="p-2">
                        <Button onClick={handleSelectAll} variant="ghost" size="sm">
                            Select All
                        </Button>
                        <Button onClick={handleClearAll} variant="ghost" size="sm">
                            Clear All
                        </Button>
                    </div>
                    <CommandSeparator />
                    {/* Searchable submissions */}
                    <CommandInput placeholder="Search submissions..." className="h-9" />
                    <CommandList>
                        {isLoading ? (
                            <CommandEmpty>Loading submissions...</CommandEmpty>
                        ) : data?.length === 0 ? (
                            <CommandEmpty>No submissions available</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {(data || []).map((submission: Submission) => (
                                    <CommandItem
                                        key={submission.id}
                                        value={submission.name}
                                        onSelect={() => handleChange(submission)}
                                    >
                                        {submission.name}
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                value.some((val) => val.id === submission.id)
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
            </PopoverContent>
        </Popover>
    )
}
