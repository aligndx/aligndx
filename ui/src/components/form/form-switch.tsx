import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Switch } from "@/components/ui/switch";

// Extend the Switch component props using React.ComponentPropsWithoutRef
type FormSwitchProps = React.ComponentPropsWithoutRef<typeof Switch> & {
    name: string;
    label: string;
    description?: string;
};

export default function FormSwitch({
    name,
    label,
    description,
    ...props // Destructure and pass through any additional props
}: FormSwitchProps) {
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
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            {...props} // Spread additional props here
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
