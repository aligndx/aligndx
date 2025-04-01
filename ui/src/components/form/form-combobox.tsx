import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Combobox } from "../ui/combobox";

type FormComboboxProps = React.ComponentPropsWithoutRef<typeof Combobox> & {
  name: string;
  label: string;
  description?: string;
};

export default function FormCombobox({
  name,
  label,
  description,
  ...props // Pass through any additional props to the Combobox
}: FormComboboxProps) {
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
            <Combobox {...props} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
