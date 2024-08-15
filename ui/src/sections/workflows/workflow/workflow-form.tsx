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


export default function WorkflowForm({name, repository, description, id, jsonSchema }: WorkflowFormProps) {
    const defaultValues = Object.entries(jsonSchema.properties).reduce((acc, [key, value]) => {
        const { default: defaultValue, type, format } = value as JsonSchemaProperty;

        let formDefault = defaultValue;

        if (format === "name") {
            formDefault = getRandomName();
        }
        acc[key] = formDefault ?? (type === 'string' ? '' : undefined);

        return acc;
    }, {} as Record<string, any>);
    const { currentUser } = useAuth();

    const formSchema = generateZodSchema(jsonSchema);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues
    });

    const { submissions } = useApiService()
    const { createSubmissionMutation } = submissions
    // const router = useRouter();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { name, ...rest } = values
        const inputs = { ...rest }
        const workflow = id
        try {
            await createSubmissionMutation.mutateAsync(
                { name, inputs, workflow, user: currentUser?.id || "" },
                {
                    onSuccess: (data) => {
                        // router.push(routes.dashboard.root)
                        toast.success("Form Submitted Successfully");
                    },
                    onError: (error) => {
                        toast.error("Form Submission Failed");
                    },
                }
            );
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div className="flex flex-grow flex-row gap-2">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 p-4 gap-4">
                    {Object.entries(jsonSchema.properties).map(([key, value]) => {
                        const { type, description, pattern, default: defaultValue, format, contentMediaType, maxItems } = value as JsonSchemaProperty;
                        const acceptKey = contentMediaType || "application/octet-stream";
                        const accept = {
                            [acceptKey]: [],
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
        <div className="flex flex-col gap-4">
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