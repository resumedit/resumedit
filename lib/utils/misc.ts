/** getElement(ARRAY, INDDEX)
If the index is non-negative, it returns the element at that index.
If the index is negative, it calculates the corresponding index from the end of the array (array.length + index) and returns that element.
If the calculated index is out of bounds (either too negative or too positive), undefined is returned, which is the default behavior of accessing an array with an invalid index in JavaScript/TypeScript.

Example:
const myArray = [1, 2, 3, 4, 5];
console.log(getElement(myArray, 1));  // Outputs: 2
console.log(getElement(myArray, -1)); // Outputs: 5
 */

export function getElement<T>(array: T[], index: number): T | undefined {
  if (index >= 0) {
    return array[index];
  } else {
    return array[array.length + index];
  }
}

export function keepOnlyFields<T extends object, K extends keyof T>(
  obj: T,
  allowedFields: Set<K>,
): Pick<T, K> {
  const result: Partial<T> = {};
  allowedFields.forEach((field) => {
    if (field in obj) {
      result[field] = obj[field];
    }
  });
  return result as Pick<T, K>;
}

export function stripFields<T extends object, K extends keyof T>(
  obj: T,
  fieldsToRemove: Set<K>,
): Omit<T, K> {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (!fieldsToRemove.has(key as string as K)) {
      result[key] = obj[key];
    }
  }

  return result as Omit<T, K>;
}
