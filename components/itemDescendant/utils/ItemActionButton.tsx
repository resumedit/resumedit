// @/components/itemDescendant/ItemDescendant.client.tsx
"use client";
import { idRegex } from "@/schemas/id";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType } from "@/types/item";
import { itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { ResumeActionType, resumeActionButtonIcons, resumeActionTypes } from "@/types/resume";
import Link from "next/link";
import { Button } from "../../ui/button";

export function getActionURL(
  pathname: string,
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  action: ResumeActionType = "edit",
) {
  // Regex pattern that combines item model and ID patterns
  const itemModelRE = new RegExp(itemDescendantModelHierarchy.join("|"));
  const idUnanchoredRE = new RegExp(idRegex.substring(1, idRegex.length - 1));
  const resumeActionRE = new RegExp(resumeActionTypes.join("|"));
  const combinedRE = new RegExp(`(${itemModelRE.source}|${idUnanchoredRE.source}|${resumeActionRE.source})*/*`, "g");

  // Replace segments in the pathname that match either of the regexes
  const baseURL = pathname.replace(combinedRE, "");

  // Construct and return the new URL
  return `/${baseURL ? baseURL + "/" : ""}${item.itemModel}/${item.id}/${action}`;
}

export interface ItemActionButtonProps {
  pathname: string;
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
  action?: ResumeActionType;
}
export function ItemActionButton(props: ItemActionButtonProps) {
  const { pathname, item, action = "view" } = props;
  const actionURL = getActionURL(pathname, item, action);
  const actionButtonInner = resumeActionButtonIcons[action];

  return actionURL ? (
    <Link href={actionURL}>
      <Button variant="ghost">{actionButtonInner}</Button>
    </Link>
  ) : null;
}
