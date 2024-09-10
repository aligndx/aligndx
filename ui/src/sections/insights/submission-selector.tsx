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
import { Drawer, DrawerContent, DrawerTrigger, DrawerDescription, DrawerTitle } from "@/components/ui/drawer" // Import Drawer from shadcn
import { CaretUpDown, CheckBoxIcon, CheckBoxOutlineBlankIcon, CheckIcon } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
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
    const [isMobile, setIsMobile] = React.useState(false) // State to track if mobile view
    const [drawerOpen, setDrawerOpen] = React.useState(false) // State to manage Drawer visibility

    const value = controlledValue.length ? controlledValue : internalValue

    const { submissions } = useApiService()
    const { data, isLoading } = submissions.getSubmissionsQuery

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768) // Set to mobile view if screen width <= 768px
        }
        handleResize() // Check initially
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

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

    // The content of the dropdown (shared between Popover and Drawer)
    const DropdownContent = () => (
        <Command>
            <div className="flex flex-row items-center justify-between p-2">
                <Button className="flex items-center gap-2" onClick={handleSelectAll} variant="ghost" size="sm">
                   <CheckBoxIcon />  
                   Select All
                </Button>
                <Button className="flex items-center gap-2" onClick={handleClearAll} variant="ghost" size="sm">
                   <CheckBoxOutlineBlankIcon />  
                   Clear All
                </Button>
            </div>
            <CommandSeparator />
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
    )

    return (
        <>
            {/* Conditionally render Drawer for mobile and Popover for desktop */}
            {isMobile ? (
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between"
                            onClick={() => setDrawerOpen(true)} // Open drawer on mobile
                        >
                            {value.length > 1 ? (
                                <Badge>{value.length} selected</Badge>
                            ) : value.length === 1 ? (
                                value[0].name
                            ) : (
                                "Select submissions..."
                            )}
                            <CaretUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="flex flex-col gap-4 p-4">
                            <DrawerTitle >Source(s)</DrawerTitle>
                            <DrawerDescription>The submissions you want to analyze </DrawerDescription>
                        </div>
                        <DropdownContent />
                    </DrawerContent>
                </Drawer>
            ) : (
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-4">
                            <h1>Source(s)</h1>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="justify-between"
                            >
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
                    <PopoverContent className="p-0">
                        <DropdownContent />
                    </PopoverContent>
                </Popover>
            )}
        </>
    )
}
