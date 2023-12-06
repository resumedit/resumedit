// @/components/appSettings/AppSettingsDialog.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import AppSettingsForm from "./AppSettingsForm";

export default function AppSettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger>Settings</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {siteConfig.name}</DialogTitle>
          <DialogDescription>Settings are stored in your browser</DialogDescription>
        </DialogHeader>
        <AppSettingsForm />
      </DialogContent>
    </Dialog>
  );
}
