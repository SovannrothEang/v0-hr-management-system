/**
 * Track Changes Utility
 * Compares original and modified objects to track changed fields
 */

/**
 * Compares two objects and returns only the changed fields
 * @param original - The original object
 * @param modified - The modified object
 * @returns Object containing only changed fields
 */
export function getChangedFields<T extends Record<string, any>>(
  original: T,
  modified: Partial<T>
): Partial<T> {
  const changes: Partial<T> = {};

  for (const key in modified) {
    if (modified.hasOwnProperty(key)) {
      const originalValue = original[key];
      const modifiedValue = modified[key];

      // Skip if values are equal
      if (originalValue === modifiedValue) {
        continue;
      }

      // Handle nested objects
      if (
        typeof originalValue === 'object' &&
        originalValue !== null &&
        typeof modifiedValue === 'object' &&
        modifiedValue !== null &&
        !Array.isArray(originalValue) &&
        !Array.isArray(modifiedValue)
      ) {
        const nestedChanges = getChangedFields(originalValue, modifiedValue);
        if (Object.keys(nestedChanges).length > 0) {
          (changes as any)[key] = nestedChanges;
        }
        continue;
      }

      // Handle arrays
      if (Array.isArray(originalValue) && Array.isArray(modifiedValue)) {
        if (JSON.stringify(originalValue) !== JSON.stringify(modifiedValue)) {
          (changes as any)[key] = modifiedValue;
        }
        continue;
      }

      // Handle dates
      if (
        typeof originalValue === 'object' &&
        originalValue !== null &&
        'getTime' in originalValue &&
        typeof modifiedValue === 'object' &&
        modifiedValue !== null &&
        'getTime' in modifiedValue
      ) {
        if (
          (originalValue as any).getTime() !== (modifiedValue as any).getTime()
        ) {
          (changes as any)[key] = modifiedValue;
        }
        continue;
      }

      // Handle different types
      if (typeof originalValue !== typeof modifiedValue) {
        (changes as any)[key] = modifiedValue;
        continue;
      }

      // Handle primitive values
      if (originalValue !== modifiedValue) {
        (changes as any)[key] = modifiedValue;
      }
    }
  }

  return changes;
}

/**
 * Compares two objects and returns a boolean indicating if there are changes
 * @param original - The original object
 * @param modified - The modified object
 * @returns Boolean indicating if there are changes
 */
export function hasChanges<T extends Record<string, any>>(
  original: T,
  modified: Partial<T>
): boolean {
  const changes = getChangedFields(original, modified);
  return Object.keys(changes).length > 0;
}

/**
 * Compares two objects and returns a deep comparison result
 * @param original - The original object
 * @param modified - The modified object
 * @returns Object with changes and metadata
 */
export function compareObjects<T extends Record<string, any>>(
  original: T,
  modified: Partial<T>
) {
  const changes = getChangedFields(original, modified);
  const hasAnyChanges = Object.keys(changes).length > 0;
  const changedFields = Object.keys(changes);

  return {
    changes,
    hasAnyChanges,
    changedFields,
    original,
    modified,
  };
}
