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
    minLength?: number;
}

interface WorkflowFormProps {
    jsonSchema: JsonSchema;
}

function capitalizeWords(input: string): string {
    const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
    const words = input.split('_');
    return words.map(capitalize).join(' ');
}


export default function WorkflowForm({ jsonSchema }: WorkflowFormProps) {
    const formSchema = generateZodSchema(jsonSchema);
    const form = useForm({
        resolver: zodResolver(formSchema),
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            toast.success("Form Submitted Successfully");
        } catch (error) {
            toast.error("Form Submission Failed");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {Object.entries(jsonSchema.properties).map(([key, value]) => {
                    const { type, description, default: defaultValue, format } = value as JsonSchemaProperty;
                    let formDefault = defaultValue 
                    if (key === "name") {
                        formDefault = getRandomName()
                    }

                    switch (type) {
                        case 'string':
                            return (
                                <FormField
                                    key={key}
                                    control={form.control}
                                    name={key}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{capitalizeWords(key)}</FormLabel>
                                            <FormDescription>{description}</FormDescription>
                                            <FormControl>
                                                <Input
                                                    type={"text"}
                                                    defaultValue={formDefault}
                                                    // placeholder={defaultValue}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            );
                        default:
                            break;
                    }
                })}

                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}
