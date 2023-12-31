// components/appSettings/AppSettingsForm.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormLabel } from "@/components/ui/form";
import { SettingsFormType, appSettingsSchema } from "@/schemas/appSettings";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { DialogClose } from "../ui/dialog";
import { Input } from "../ui/input";

const AppSettingsForm = () => {
  const defaultValues = useAppSettingsStore.getState();
  const setSettings = useAppSettingsStore((state) => state.setSettings);

  const form = useForm<SettingsFormType>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: defaultValues,
  });

  // Function to update the Zustand store if validation passes
  const updateStoreIfValid = async <T extends string | boolean>(name: keyof SettingsFormType, value: T) => {
    if (typeof value === "boolean") {
      form.setValue(name, value as boolean); // For boolean fields
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(name, value as any); // For string fields
    }
    const isValid = await form.trigger(name);
    if (isValid) {
      setSettings({ ...form.getValues() });
    }
  };

  // React Hook Form's submit function
  const onSubmit = (data: SettingsFormType) => {
    // Update Zustand store with new settings
    setSettings(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.entries(appSettingsSchema.shape).map(([key, schema]) => {
          const isCheckbox = schema instanceof z.ZodBoolean;
          return (
            <div key={key} className="form-item">
              {
                // eslint-disable-next-line no-constant-condition
                false ? null : /*key in Object.keys(formRenderer) ? (
                renderForm(key as FormRendererKeyType)
              ) */ isCheckbox ? (
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
                )
              }
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

export default AppSettingsForm;
