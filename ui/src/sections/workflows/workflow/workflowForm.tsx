'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "@/routes";
import { toast } from "@/components/ui/sonner";
import { string, z } from "zod"
import generateZodSchema, { JsonSchema } from "@/lib/parser";

interface JsonSchemaProperty {
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
            // Handle form submission (e.g., API call)
            toast.success("Form Submitted Successfully");
            console.log('Form submitted:', values);
        } catch (error) {
            toast.error("Form Submission Failed");
            console.error('Form submission error:', error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid w-[400px] space-y-6">
                {Object.entries(jsonSchema.properties).map(([key, value]) => {
                    const { description, default: defaultValue } = value as JsonSchemaProperty;
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
                                            // placeholder={defaultValue}
                                            defaultValue={defaultValue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    );
                })}

                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}
