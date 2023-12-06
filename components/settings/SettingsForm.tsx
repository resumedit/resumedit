// components/settings/SettingsForm.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormLabel } from "@/components/ui/form";
import { SettingsFormType, settingsSchema } from "@/schemas/settings";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { Input } from "../ui/input";
import { DialogClose } from "../ui/dialog";

const SettingsForm = () => {
  const defaultValues = useSettingsStore.getState();

  // const { control, handleSubmit } = useForm<SettingsFormType>({
  const form = useForm<SettingsFormType>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultValues,
  });

  function onSubmit(data: SettingsFormType) {
    // Update Zustand store with new settings
    useSettingsStore.setState(data);
    // Additional submit logic
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {Object.entries(settingsSchema.shape).map(([key, schema]) => {
          const isCheckbox = schema instanceof z.ZodBoolean;
          return (
            <div key={key} className="form-item">
              <FormLabel>{key}</FormLabel>
              {isCheckbox ? (
                <Controller
                  name={key as keyof SettingsFormType}
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      {...{ ...field, value: undefined }}
                      checked={field.value === null ? undefined : (field.value as CheckedState)}
                      onCheckedChange={(e) => field.onChange(e)}
                    />
                  )}
                />
              ) : (
                <Input {...form.register(key as keyof SettingsFormType)} />
              )}
            </div>
          );
        })}
        <DialogClose asChild>
          <Button type="submit">Save Settings</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

export default SettingsForm;
