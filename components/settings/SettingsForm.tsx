// components/settings/SettingsForm.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormLabel } from "@/components/ui/form";
import { SettingsFormType, settingsSchema } from "@/schemas/settings";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { DialogClose } from "../ui/dialog";
import { Input } from "../ui/input";

const SettingsForm = () => {
  const defaultValues = useSettingsStore.getState();
  const updateSettingsStore = useSettingsStore((state) => state.setSettings);

  const form = useForm<SettingsFormType>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultValues,
  });

  // Function to update the Zustand store if validation passes
  const updateStoreIfValid = async (name: keyof SettingsFormType, value: string | boolean) => {
    form.setValue(name, value); // Update form state
    const isValid = await form.trigger(name);
    if (isValid) {
      updateSettingsStore({ ...form.getValues() }); // Update Zustand store
    }
  };

  // React Hook Form's submit function
  const onSubmit = (data: SettingsFormType) => {
    // Update Zustand store with new settings
    updateSettingsStore(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.entries(settingsSchema.shape).map(([key, schema]) => {
          const isCheckbox = schema instanceof z.ZodBoolean;
          return (
            <div key={key} className="form-item">
              {isCheckbox ? (
                <div className="flex items-center space-x-2">
                  <Controller
                    name={key as keyof SettingsFormType}
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Checkbox
                          id={key}
                          {...{ ...field, value: undefined }}
                          checked={field.value as boolean}
                          onCheckedChange={(checked) => {
                            updateStoreIfValid(key as keyof SettingsFormType, checked);
                          }}
                        />
                        <FormLabel htmlFor={key} className="font-normal">
                          {key}
                        </FormLabel>
                      </>
                    )}
                  />
                </div>
              ) : (
                <>
                  <FormLabel>{key}</FormLabel>
                  <Input {...form.register(key as keyof SettingsFormType)} />
                </>
              )}
            </div>
          );
        })}
        <DialogClose asChild>
          <Button type="submit">Close</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

export default SettingsForm;
