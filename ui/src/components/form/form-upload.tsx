import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { FileUploader } from "../file-uploader";

// Extend the Uploader component props using React.ComponentPropsWithoutRef
type FormUploaderProps = React.ComponentPropsWithoutRef<typeof FileUploader> & {
    name: string;
    label: string;
    description?: string;
};

export default function FormUploader({
    name,
    label,
    description,
    ...props // Destructure and pass through any additional props
}: FormUploaderProps) {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormControl>
                        <FileUploader
                            {...props}
                            value={field.value}
                            onValueChange={field.onChange}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
