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
import { useEffect, useState } from "react";
import { Submission } from "@/types/submission";
import { routes, useUpdateSearchParams } from "@/routes";
import FormInput from "@/components/form/form-text";
import FormUploader from "@/components/form/form-upload";
import { capitalize } from "@/lib/utils";
import { Workflow } from "@/types/workflow";

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
    workflow: Workflow;
}

export default function WorkflowForm({ workflow }: WorkflowFormProps) {
    const updateSearchParams = useUpdateSearchParams()

    const jsonSchema = workflow.schema
    const id = workflow.id

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
        defaultValues: {
            ...defaultValues,
            name : getRandomName()
        }
    });

    const { submissions, data } = useApiService()
    const { createSubmissionMutation } = submissions
    const { onUpload, progresses, isUploading } = data.useUploadFileMutation([]);

    async function onSubmit(values: z.infer<typeof extendedFormSchema>) {
        const { name, ...rest } = values;
        const inputs = { ...rest };

        // Transform inputs to file objects for upload
        function transformInputsToFiles(inputs: Record<string, any>) {
            const filePathKeys = getFilePathKeys(jsonSchema);
            return Object.entries(inputs)
                .filter(([id]) => filePathKeys.includes(id)) // Filter to include only keys present in filePathKeys
                .flatMap(([id, files]: [string, File[]]) =>
                    files.map((file) => ({
                        id,
                        file,
                    }))
                );
        }

        const fileInputs = transformInputsToFiles(inputs);

        try {
            let uploadResults = [];

            // If there are files, upload them
            if (fileInputs.length > 0) {
                uploadResults = await onUpload(fileInputs, { user: currentUser?.id || "" });
            }

            // Process the uploaded results
            const attachedData: string[] = [];
            const newFileInputs: Record<string, string> = {};

            uploadResults.forEach((item) => {
                newFileInputs[item.id] = item.data.id;
                attachedData.push(item.data.id);
            });

            // Merge file inputs with form inputs
            const mergedInputs = {
                ...inputs,
                ...newFileInputs,
            };

            if (typeof name !== 'string') {
                throw new Error('Name must be a string');
            }

            const submissionPayload = {
                name,
                params: mergedInputs,
                workflow : id,
                user: currentUser?.id || "",
            };

            await createSubmissionMutation.mutateAsync(submissionPayload, {
                onSuccess: (data) => {
                    toast.success("Form Submitted Successfully");
                    updateSearchParams({ "id": data.id }, routes.dashboard.submissions.submission);
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
                    <FormInput
                        name="name"
                        label="Name"
                        description="A run name for this submission"
                        type="text"
                    />
                    {Object.entries(jsonSchema.properties).map(([key, value]) => {
                        const { type, description, pattern, default: defaultValue, format, contentMediaType, maxItems } = value as JsonSchemaProperty;
                        const acceptKey = contentMediaType;
                        const accept: Record<string, any> = {};
                        if (acceptKey && typeof acceptKey === "string") {
                            accept[acceptKey] = [];
                        }

                        const maxFileCount = maxItems || undefined

                        switch (format) {
                            case 'file-path':
                                return <FormUploader
                                    key={key}
                                    name={key}
                                    label={capitalize(key)}
                                    description={description}
                                    accept={accept}
                                    multiple
                                    compact
                                    progresses={progresses}
                                    disabled={isUploading}
                                    maxFileCount={maxFileCount}
                                />
                            default:
                                return <FormInput
                                    key={key}
                                    name={key}
                                    label={capitalize(key)}
                                    description={description}
                                    type="text"
                                />
                        }

                    })}

                    <Button variant="expandIcon" Icon={ArrowRight} iconPlacement="right" className="text-background-foreground" type="submit">Submit</Button>
                </form>
            </Form> 
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