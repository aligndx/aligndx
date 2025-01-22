import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Slider } from "@/components/ui/slider"

// Extend the Slider component props using React.ComponentPropsWithoutRef
type FormSliderProps = React.ComponentPropsWithoutRef<typeof Slider> & {
    name: string;
    label: string;
    description?: string;
};

export default function FormSlider({
    name,
    label,
    description,
    ...props // Destructure and pass through any additional props
}: FormSliderProps) {
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
                        <Slider
                            defaultValue={[field.value]}
                            onValueChange={(vals) => {
                                field.onChange(vals[0]);
                              }}
                            {...props} // Spread additional props here
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
