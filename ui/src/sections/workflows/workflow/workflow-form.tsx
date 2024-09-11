'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod"
import generateZodSchema, { JsonSchema } from "@/lib/parser";
import getRandomName from "@/lib/getRandomName";
import { useApiService } from "@/services/api";
import { useAuth } from "@/contexts/auth-context";
import { FileUploader } from "@/components/file-uploader";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, GitBranch } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import DOMPurify from "dompurify";
import { useUploadFile } from "@/hooks/use-upload-file";
import { useEffect, useState } from "react";
import { Submission } from "@/types/submission";
import { routes, useUpdateSearchParams } from "@/routes";

export interface JsonSchemaProperty {
    type: string;
    description?: string;
    default?: any;
    pattern?: string;
    items?: {
        type: string;
        pattern?: string;
    };
    format?: string;
    maxItems: number;
    minLength?: number;
    contentMediaType?: string;
}

interface WorkflowFormProps {
    id: string;
    name: string;
    repository: string;
    description: string;
    jsonSchema: JsonSchema;
}

function capitalizeWords(input: string): string {
    const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
    const words = input.split('_');
    return words.map(capitalize).join(' ');
}


export default function WorkflowForm({ name, repository, description, id, jsonSchema }: WorkflowFormProps) {
    const updateSearchParams = useUpdateSearchParams()

    const defaultValues = Object.entries(jsonSchema.properties).reduce((acc, [key, value]) => {
        const { default: defaultValue, type, format } = value as JsonSchemaProperty;

        let formDefault = defaultValue;

        acc[key] = formDefault ?? (type === 'string' ? '' : undefined);

        return acc;
    }, {} as Record<string, any>);
    const { currentUser } = useAuth();

    function getFilePathKeys(jsonSchema: JsonSchema): string[] {
        return Object.keys(jsonSchema.properties).filter(key => {
            const property = jsonSchema.properties[key] as JsonSchemaProperty;
            return property.format === 'file-path';
        });
    }

    const formSchema = generateZodSchema(jsonSchema);
    const extendedFormSchema = formSchema.extend({
        name: z.string().min(1, 'Name is required'),  // Example: `name` as a required string
      });
    const form = useForm({
        resolver: zodResolver(extendedFormSchema),
        defaultValues
    });

    const { submissions } = useApiService()
    const { createSubmissionMutation } = submissions
    const { onUpload, progresses, isUploading } = useUploadFile({
        defaultUploadedFiles: [],
    });

    async function onSubmit(values: z.infer<typeof extendedFormSchema>) {
        const { name, ...rest } = values
        const inputs = { ...rest }

        // Todo fix typigns
        function transformInputsToFiles(inputs: any) {
            const filePathKeys = getFilePathKeys(jsonSchema);
            return Object.entries(inputs)
                .filter(([id]) => filePathKeys.includes(id)) // Filter to include only keys present in filePathKeys
                .flatMap(([id, files]: any) =>
                    files.map((file: any) => ({
                        id,
                        file,
                    }))
                );
        }
        const fileInputs = transformInputsToFiles(inputs)

        try {
            let uploadResults = []
            if (fileInputs.length > 0) {
                uploadResults = await onUpload(fileInputs, { user: currentUser?.id || "" });
                // Check if all files were successfully uploaded
                const allUploadsSuccessful = uploadResults.every(result => result.success);

                if (!allUploadsSuccessful) {
                    throw new Error("File upload failed");
                }
            }

            // grab file inputs if they exist
            const attachedData: string[] = []
            const newFileInputs: Record<string, string> = {};
            uploadResults.forEach((item) => {
                newFileInputs[item.id] = item.data.id
                attachedData.push(item.data.id)
            })
            const mergedInputs = {
                ...inputs,
                ...newFileInputs
            }

            // Proceed with the rest of the form submission
            const workflow = id;
            if (typeof name !== 'string') {
                throw new Error('Name must be a string');
              }

            const submissionPayload = {
                name,
                params: mergedInputs,
                workflow,
                user: currentUser?.id || "",
            };

            await createSubmissionMutation.mutateAsync(submissionPayload, {
                onSuccess: (data) => {
                    toast.success("Form Submitted Successfully");
                    updateSearchParams({ "id": data.id }, routes.dashboard.submissions.submission)
                },
                onError: (error) => {
                    toast.error("Form Submission Failed");
                },
            });
        } catch (error) {
            console.error("Error:", error);
            toast.error("There was an error submitting the form");
        }
    }

    return (
        <div className="flex flex-grow flex-row gap-2">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 p-4 gap-4">
                    <FormField
                        control={form.control}
                        name={"name"}
                        defaultValue={getRandomName()}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Name
                                </FormLabel>
                                <FormDescription>A run name for this submission.</FormDescription>
                                <FormControl>
                                    <Input type="text" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {Object.entries(jsonSchema.properties).map(([key, value]) => {
                        const { type, description, pattern, default: defaultValue, format, contentMediaType, maxItems } = value as JsonSchemaProperty;
                        const acceptKey = contentMediaType;
                        const accept: Record<string, any> = {};
                        if (acceptKey && typeof acceptKey === "string") {
                            accept[acceptKey] = [];
                        }

                        const maxFileCount = maxItems || undefined

                        return (
                            <FormField
                                key={key}
                                control={form.control}
                                name={key}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {capitalizeWords(key)}
                                        </FormLabel>
                                        <FormDescription>{description}</FormDescription>
                                        <FormControl>
                                            {(() => {
                                                switch (format) {
                                                    case 'file-path':
                                                        return <FileUploader
                                                            accept={accept}
                                                            multiple
                                                            compact
                                                            progresses={progresses}
                                                            disabled={isUploading}
                                                            maxFileCount={maxFileCount}
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        />
                                                    default:
                                                        return <Input type="text" {...field} />;
                                                }
                                            })()}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )
                    })}

                    <Button variant="expandIcon" Icon={ArrowRight} iconPlacement="right" className="text-background-foreground" type="submit">Submit</Button>
                </form>
            </Form>
            <div className="hidden md:flex w-[300px] flex-col gap-4 p-4 border bg-muted/50">
                <header className="flex  gap-2 text-lg" >
                    {name}
                    <a className="flex flex-row  gap-2 underline items-center text-sm hover:text-muted-foreground"
                        href={repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); }}
                    >
                        <GitBranch />
                    </a>
                </header>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
                <Separator className="my-4" />
            </div>
        </div>

    );
}


export function WorkflowFormSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-4 w-full">
            <WorkflowSkeletonInput />
            <WorkflowSkeletonFileInput />
            <WorkflowSkeletonInput />
            <Skeleton className="w-full h-12" />
        </div>
    )
}

function WorkflowSkeletonInput() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="w-10 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-full h-16" />
        </div>
    )
}

function WorkflowSkeletonFileInput() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="w-10 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-full h-52" />
        </div>
    )
}