import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

// Extend the Input component props using React.ComponentPropsWithoutRef
type FormInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
    name: string;
    label: string;
    description?: string;
};

export default function FormInput({
    name,
    label,
    description,
    ...props // Destructure and pass through any additional props
}: FormInputProps) {
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
                        <Input
                            {...field}
                            {...props}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
