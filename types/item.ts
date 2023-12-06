// @/types/item.ts

import { IdSchemaType } from "@/schemas/id";

/**
 * Represents the type for client-generated IDs. This type is used to uniquely
 * identify items created on the client side before they are persisted to the server.
 * It is typically a string that conforms to a specific format.
 */
export type ClientIdType = IdSchemaType;

/**
 * Enum representing the state of an item in relation to its synchronization
 * status between the client and the server. This status is crucial for
 * understanding the current state of an item, especially during the sync
 * process between the client's local state and the server's persisted state.
 *
 * - `New`: The item has been created on the client and has not yet been acknowledged by the server.
 * - `Modified`: The item is known to the server but has been modified on the client.
 * - `Synced`: The item is in sync between the client and the server, with no pending changes.
 * - `Deleted`: The item has been marked for deletion on the client and awaits confirmation from the server.
 *
 * Note: The `ItemDisposition` property has meaning only in the context of a
 * specific client-server interaction. It is maintained by each client but not
 * by the server. The server utilizes this enum when responding to a client,
 * thus the meanings of `New`, `Modified`, `Synced`, and `Deleted` always
 * refer to the state last known or acknowledged by the client.
 */
export enum ItemDisposition {
  /**
   * Note: this state is only used for the initial server-side rendering of the component.
   * Represents an item of which the server cannot know if the opposite party has seen it before and in what state the opposite party is.
   * Items in this state are usually pending to be added to or updated in the client's data store.
   */
  Initial = "INITIAL",

  /**
   * Represents a new item that the server or the opposite party in the sync
   * process has not seen before. Items in this state are usually pending
   * to be added to the server's data store.
   */
  New = "NEW",

  /**
   * Indicates that the item, previously known to the server, has been modified
   * on the client side. This status signals that an update sync is required to
   * reflect these changes on the server.
   */
  Modified = "MODIFIED",

  /**
   * A state that signifies an item is in sync with the server's version.
   * This status is typically set after a successful sync operation, indicating
   * that both client and server have the same data for this item.
   */
  Synced = "SYNCED",

  /**
   * Used for items that are marked for deletion. This status indicates that
   * the item should no longer be shown to the user
   */
  Deleted = "DELETED",

  /**
   * Used for items that have been removed. This status indicates to the client
   * that the item should be removed from the persistent storage.
   */
  Obsoleted = "OBSOLETED",
}
