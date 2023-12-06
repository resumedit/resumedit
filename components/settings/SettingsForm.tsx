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
// import { ReactNode, useRef } from "react";
// import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
// import { ParentItemListType } from "@/types/parentItemList";
// import { ItemClientStateType } from "@/types/item";
// import { handleParentItemListFromClient } from "@/actions/parentItemList";
// import { toast } from "../ui/use-toast";
// import { dateToISOLocal } from "@/lib/utils/formatDate";
// import { useStoreName } from "@/contexts/StoreNameContext";

const SettingsForm = () => {
  const defaultValues = useSettingsStore.getState();
  const updateSettingsStore = useSettingsStore((state) => state.setSettings);
  /*
  const synchronizationInterval = useSettingsStore((state) => state.synchronizationInterval);
  const setSynchronizationInterval = useSettingsStore((state) => state.setSynchronizationInterval);

  // FIXME: The below call to useStoreName() fails because the `SettingsForm`
  component is always located outside the ParentItemListClientComponent
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const parent = store((state) => state.parent);
  const itemModel = store((state) => state.itemModel);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const syncIntervalInputRef = useRef<HTMLSelectElement>(null);
  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);
  */

  const form = useForm<SettingsFormType>({
    resolver: zodResolver(settingsSchema),
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
      updateSettingsStore({ ...form.getValues() });
    }
  };

  // React Hook Form's submit function
  const onSubmit = (data: SettingsFormType) => {
    // Update Zustand store with new settings
    updateSettingsStore(data);
  };

  /*
  const formRenderer = {
    // synchronizationInterval: renderSynchronizationInterval,
  };

  type FormRendererKeyType = keyof typeof formRenderer;

  function renderForm(key: FormRendererKeyType): ReactNode {
    return formRenderer[key](key);
  }

  async function sendParentItemListToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!parent || !items) {
      throw Error(`handleParentItemListFromClient(itemModel=${itemModel}, parent is ${parent}  items is ${items})`);
    }

    const clientList = { parent, items } as ParentItemListType<ItemClientStateType, ItemClientStateType>;

    const clientModified = parent.lastModified;
    const updatedItemList = await handleParentItemListFromClient(itemModel, clientList);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.parent.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientList.items.length
          }\nServer: ${dateToISOLocal(serverModified)}: ${updatedItemList.items.length}`,
        });
      }
    }
  }

  function renderSynchronizationInterval(key: FormRendererKeyType): ReactNode {
    function displayInterval(interval: number): string {
      if (interval <= 0) {
        return "Sync off";
      }
      if (interval % 60 == 0) {
        return `${interval / 60}min`;
      } else {
        return `${interval}s`;
      }
    }

    async function setSyncInterval(value: string) {
      const interval = Number(value);

      if (typeof interval === "number") {
        setSynchronizationInterval(interval);
        if (interval > 0) {
          if (syncIntervalInputRef.current) {
            syncIntervalInputRef.current.className = "text-bold";
            syncIntervalInputRef.current.value = displayInterval(interval);
          }
        }
      }
    }
    

    return (
      <>
        <FormLabel>{key}</FormLabel>
        <Input {...form.register(key as keyof SettingsFormType)} />
        <Select onValueChange={setSyncInterval}>
          <SelectTrigger className="w-32">
            <SelectValue ref={syncIntervalInputRef} placeholder={displayInterval(synchronizationInterval)} />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 10, 30, 60].map((interval, index) => (
              <SelectItem key={index} value={String(interval)}>
                {displayInterval(interval)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={sendParentItemListToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </>
    );
  }
  */

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.entries(settingsSchema.shape).map(([key, schema]) => {
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

export default SettingsForm;
