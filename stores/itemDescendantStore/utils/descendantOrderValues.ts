import { IdSchemaType } from "@/schemas/id";
import { ItemClientStateType, ItemDisposition, ItemOrderableClientStateType } from "@/types/item";

/**
 * Helper function for finding index of descendant object in given array
 * @param {ItemClientStateType[]} arr - Array of Items
 * @param {string} id - id of descendant object
 * @returns Index of descendant object in the descendants array
 */
export const findItemIndexByClientId = (arr: Array<ItemClientStateType>, id: IdSchemaType): number => {
  return arr.findIndex((descendant) => descendant.clientId === id);
};

type OrderParams = {
  targetDelta: number;
  minimalDelta: number;
  randomOffsetMax: number;
  targetCapacity: number;
  targetLowerBound: number;
  targetUpperBound: number;
  acceptableLowerBound: number;
  acceptableUpperBound: number;
  orderBase: number;
  minimalOffset: number;
};

// Define upper and lower bounds for order values
function getOrderParams<ItemOrderableClientStateType>(descendants: Array<ItemOrderableClientStateType>) {
  // Delta between descendants to make optimial use of target range
  const targetDelta = 1;

  let minimalDelta = 1000000 * Number.EPSILON;
  // const minimalDelta = 0.1;
  let randomOffsetMax = minimalDelta / 2;

  // Target values determine the result of the compression
  // Capacity: at least 128 or twice the smallest power of 2 that can contain all descendants
  let targetCapacity = Math.max(128, Math.pow(2, 4 + Math.ceil(Math.log2(descendants.length))));

  let acceptableRangeScaleFactor = 8;

  // For debugging, increase minimalDelta and randomOffsetMax and begin order at 0
  if (process.env.NODE_ENV === "development") {
    minimalDelta = 0.2;
    randomOffsetMax = 0;
    targetCapacity = Math.pow(2, Math.ceil(Math.log2(descendants.length)));
    acceptableRangeScaleFactor = 2;
  }

  const targetHalfRange = targetCapacity * targetDelta;

  const targetLowerBound = Math.max(-targetHalfRange, -Number.MAX_VALUE / 2);

  const targetUpperBound = Math.min(targetHalfRange, Number.MAX_VALUE / 2);

  // Acceptable values determine when compression is triggered
  const acceptableHalfRange = acceptableRangeScaleFactor * targetHalfRange;
  const acceptableLowerBound = Math.max(-acceptableHalfRange, -Number.MAX_VALUE / 2);
  const acceptableUpperBound = Math.min(acceptableHalfRange, Number.MAX_VALUE / 2);

  const orderBase = Math.ceil(targetLowerBound + (targetCapacity - (descendants.length + randomOffsetMax) / 2));

  const minimalOffset = minimalDelta + randomOffsetMax;

  return {
    targetDelta: targetDelta,
    minimalDelta: minimalDelta,
    randomOffsetMax: randomOffsetMax,
    targetCapacity: targetCapacity,
    targetLowerBound: targetLowerBound,
    targetUpperBound: targetUpperBound,
    acceptableLowerBound: acceptableLowerBound,
    acceptableUpperBound: acceptableUpperBound,
    orderBase: orderBase,
    minimalOffset: minimalOffset,
  };
}

export function getOrderValueForAppending(descendants: Array<ItemOrderableClientStateType>): number {
  if (descendants.length === 0) {
    return 0; // Start with a default value if the list is empty
  }

  const { targetDelta, randomOffsetMax } = getOrderParams(descendants);
  const maxOrder = descendants.reduce((max, descendant) => {
    return descendant.order > max ? descendant.order : max;
  }, 0);

  // Add a small random offset
  const randomOffset = Math.random() * randomOffsetMax;
  return maxOrder + targetDelta + randomOffset;
}

export function randomizeOrderValue(order: number, { randomOffsetMax }: OrderParams): number {
  const randomOffset = Math.random() * randomOffsetMax;
  const randomizedOrder = order + randomOffset;
  return randomizedOrder;
}

export function reBalanceListOrderValues(
  descendants: Array<ItemOrderableClientStateType>,
  force?: boolean,
): Array<ItemOrderableClientStateType> {
  const { targetDelta, randomOffsetMax, acceptableLowerBound, acceptableUpperBound, orderBase } =
    getOrderParams(descendants);

  const orders = descendants.map((a) => a.order);
  const maxOrder = Math.max(...orders);
  const minOrder = Math.min(...orders);

  if (!force && maxOrder < acceptableUpperBound && minOrder > acceptableLowerBound) {
    return descendants; // No compression needed
  }

  // Normalize orders to a new range
  const itemsWithOrderValuesReset = descendants.map((descendant, index) => {
    // Add random offset to reduce probability of collisions
    const randomOffset = Math.random() * randomOffsetMax;
    const newOrder = orderBase + index * targetDelta + randomOffset;

    // Ensure that the `order` and `disposition` properties are added first,
    // so they are displayed first.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { order, disposition: disposition, ...otherProps } = descendant;
    const orderedItem = {
      order: newOrder,
      disposition:
        descendant.disposition === ItemDisposition.Synced ? ItemDisposition.Modified : descendant.disposition,
      ...otherProps,
    };

    return orderedItem;
  });

  return itemsWithOrderValuesReset as Array<ItemOrderableClientStateType>;
}

const getFirstOrderValue = (nextValidOrder: number | undefined, orderParams: OrderParams) => {
  const { targetDelta, targetLowerBound, acceptableLowerBound, orderBase } = orderParams;
  let firstOrderValue = orderBase;
  if (nextValidOrder !== undefined) {
    if (nextValidOrder > targetLowerBound) {
      firstOrderValue = nextValidOrder - targetDelta;
    } else if (nextValidOrder > acceptableLowerBound) {
      firstOrderValue = (nextValidOrder - acceptableLowerBound) / 2;
    }
  }
  return firstOrderValue;
};

function getCenteredOrderValue(prevOrder: number, nextOrder: number | undefined, orderParams: OrderParams) {
  const { minimalOffset } = orderParams;
  const lowerBound = prevOrder + minimalOffset;
  let upperBound = lowerBound;
  if (nextOrder !== undefined) {
    upperBound = nextOrder - minimalOffset;
  }
  const centeredOrderValue = lowerBound + (upperBound - lowerBound) / 2;
  return centeredOrderValue;
}

function getLastOrderValue(prevOrder: number, orderParams: OrderParams) {
  const { targetDelta, targetUpperBound, acceptableUpperBound } = orderParams;
  let lastOrderValue = prevOrder + targetDelta;
  if (prevOrder > targetUpperBound) {
    lastOrderValue = getCenteredOrderValue(prevOrder, acceptableUpperBound, orderParams);
  }
  return lastOrderValue;
}

function getAdjustedOrderValue(
  descendant: ItemOrderableClientStateType,
  orderParams: OrderParams,
  index: number,
  prevOrder: number | undefined,
  nextOrder: number | undefined,
  afterNextOrder: number | undefined,
): number {
  const { targetDelta, minimalDelta, minimalOffset } = orderParams;

  let newOrder = descendant.order;

  const deltaPrev = prevOrder === undefined ? targetDelta : newOrder - prevOrder;

  const prevValidSuccessors = [nextOrder, afterNextOrder]
    .filter((s) => {
      return prevOrder === undefined || (s !== undefined && s > prevOrder + 2 * minimalOffset);
    })
    .sort((a, b) => (b !== undefined ? (a !== undefined ? a - b : 1) : 0));
  const prevNextValidOrder = prevValidSuccessors.length > 0 ? prevValidSuccessors[0] : undefined;
  const prevAfterNextValidOrder =
    prevValidSuccessors.length > 1 ? prevValidSuccessors[prevValidSuccessors.length - 1] : undefined;

  const deltaPrevNextValid =
    prevOrder !== undefined && prevNextValidOrder !== undefined ? prevNextValidOrder - prevOrder : undefined;

  const validSuccessors = [nextOrder, afterNextOrder]
    .filter((s) => {
      return prevOrder === undefined || (s !== undefined && s > prevOrder + 2 * minimalOffset);
    })
    .sort((a, b) => (b !== undefined ? (a !== undefined ? a - b : 1) : 0));
  const nextValidOrder = validSuccessors.length > 0 ? validSuccessors[0] : undefined;
  // const afterNextValidOrder =
  //   validSuccessors.length > 1 ? validSuccessors[validSuccessors.length - 1] : undefined;

  const deltaNextValid = nextValidOrder !== undefined ? nextValidOrder - newOrder : undefined;
  const deltaAfterNextValid = prevAfterNextValidOrder !== undefined ? prevAfterNextValidOrder - newOrder : undefined;
  const deltaNextAfterNextValid =
    nextValidOrder !== undefined && prevAfterNextValidOrder !== undefined
      ? prevAfterNextValidOrder - nextValidOrder
      : undefined;

  if (prevOrder === undefined) {
    // This is the first descendant and can be shifted lower as long as
    // it remains within acceptableLowerBound
    newOrder = getFirstOrderValue(prevNextValidOrder, orderParams);
  } else {
    if (deltaPrev > minimalDelta) {
      if (afterNextOrder === undefined) {
        // This is the second last descendant.
        // As it has sufficient distance from the previous one and the last descendant
        // may shift arbitrarily, there is no need to adjust this descendant
      } else if (nextOrder === undefined) {
        // This is the last descendant and it has enough distance, hence no need to adjust it
      } else {
        // Common case: The descendant has at least two successors and we have the following
        // three order values to consider:
        //     [current descendant: newOrder] [next descendant: nextOrder] [descendant after next: afterNextOrder]
        // The range within which we can operate without affecting descendants beyond these three
        // is given by:
        //     usableRange = ( prevOrder + minimalDelta, max(nextOrder, afterNextOrder) - minimalDelta)

        if (
          deltaPrevNextValid !== undefined &&
          deltaNextValid !== undefined &&
          deltaAfterNextValid !== undefined &&
          deltaNextAfterNextValid !== undefined
        ) {
          if (deltaNextValid < minimalDelta) {
            // The distance from current to next descendant is not sufficient, hence we need to adjust
            // either this or the next descendant
            // To determine, which one to adjust, we consider two relative distances:
            // deltaPrevNextValid: the distance from the descendant before this to the one closest
            //     after it. This is the interval within which we could place this descendant
            // deltaAfterNextvalid: the distance from this descendant to the one of the two successors
            //     that is farther away. This is the interval within which the next descendant could be
            //     placed if we left the current one as is
            if (deltaPrevNextValid > deltaAfterNextValid) {
              // Determine if it is feasible and sufficent to shift this descendant toward the previous descendant
              newOrder = getCenteredOrderValue(prevOrder, prevNextValidOrder, orderParams);
            }
          }
        } else {
          console.log(
            `${index}: deltaNextValid=${deltaNextValid} deltaAfterNextValid=${deltaAfterNextValid} deltaNextAfterNextValid=${deltaNextAfterNextValid} prevOrder=${prevOrder} newOrder=${newOrder}`,
          );
        }
      }
    } else {
      // As this descendant does not have sufficient distance (or even negative distance)
      // to the previous one, it needs to be modified
      if (nextOrder === undefined) {
        // This is the last descendant and can be shifted arbitrarily
        newOrder = getLastOrderValue(prevOrder, orderParams);
      } else {
        // Determine if it is sufficent to shift this descendant toward the smaller of the next two descendants
        newOrder = getCenteredOrderValue(prevOrder, prevNextValidOrder, orderParams);
      }
    }
  }
  return newOrder;
}

function adjustListOrderValues(descendants: Array<ItemOrderableClientStateType>): Array<ItemOrderableClientStateType> {
  const orderParams = getOrderParams(descendants);
  const { randomOffsetMax } = orderParams;

  /* Invariants:
   * I1: The order values are strictly monotonically increasing
   * I2: The distance between each pair is greater than minimalDelta
   *
   * We want to modify the minimal number of descendants needed to satisfy all invariants.
   */
  // Maintain an up-to-date reference of the previous descendant's order value
  // Substitute the current descendant's - targetDelta to initialize
  // const minOrderValue = descendants.reduce((minOrder, descendant) => {
  //   return descendant.order < minOrder ? descendant.order : minOrder;
  // }, 0);
  let prevOrder: number | undefined = undefined;
  // The order of the next descendant might be undefined
  let nextOrder = descendants[1].order;
  // The order of the descendant after the next might be undefined
  let afterNextOrder = descendants[2]?.order;

  return descendants.map((descendant, index) => {
    const newOrder = getAdjustedOrderValue(descendant, orderParams, index, prevOrder, nextOrder, afterNextOrder);

    // Update only if modified
    if (newOrder !== descendant.order) {
      // Add random offset to reduce probability of collisions
      const randomOffset = Math.random() * randomOffsetMax;
      descendant = {
        ...descendant,
        order: newOrder + randomOffset,
        disposition: ItemDisposition.Modified,
      };
    }

    prevOrder = newOrder; // Update prevOrder for the next iteration
    nextOrder = descendants[index + 2]?.order; // Update nextOrder for the next iteration
    afterNextOrder = descendants[index + 3]?.order; // Update afterNextOrder for the next iteration

    return descendant;
  });
}

function validateListOrderValues(descendants: Array<ItemOrderableClientStateType>): boolean {
  const { minimalDelta } = getOrderParams(descendants);
  for (let i = 1; i < descendants.length; i++) {
    if (!(descendants[i].order >= descendants[i - 1].order + minimalDelta)) {
      return false;
    }
  }
  return true;
}

export function updateListOrderValues(
  descendants: Array<ItemOrderableClientStateType>,
): Array<ItemOrderableClientStateType> {
  if (descendants.length <= 1) return descendants;

  // Update order values with minimal changes to reflect sequence
  // of descendants in `descendants` array
  const updatedItems = adjustListOrderValues(descendants);

  // Use compressOrderValues after updateOrderValues if necessary
  const finalItems = reBalanceListOrderValues(updatedItems);

  if (!validateListOrderValues(finalItems)) {
    return descendants;
  }

  return finalItems;
}
