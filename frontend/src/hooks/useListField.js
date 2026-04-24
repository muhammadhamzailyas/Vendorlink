import { useCallback } from "react";

/**
 * Hook for managing add/remove operations on array fields in form state.
 *
 * @param {Function} setter - State setter function (e.g., setFormData)
 * @param {string} fieldPath - Dot-notation path to the array field (e.g., "skills" or "portfolioLinks")
 * @returns {{ add, remove, update }} - Helpers to manipulate the list
 */
const useListField = (setter, fieldPath) => {
  const add = useCallback(
    (defaultValue = "") => {
      setter((prev) => ({
        ...prev,
        [fieldPath]: [...(prev[fieldPath] || []), defaultValue],
      }));
    },
    [setter, fieldPath]
  );

  const remove = useCallback(
    (index) => {
      setter((prev) => ({
        ...prev,
        [fieldPath]: prev[fieldPath].filter((_, i) => i !== index),
      }));
    },
    [setter, fieldPath]
  );

  const update = useCallback(
    (index, value) => {
      setter((prev) => {
        const updated = [...prev[fieldPath]];
        updated[index] = value;
        return { ...prev, [fieldPath]: updated };
      });
    },
    [setter, fieldPath]
  );

  return { add, remove, update };
};

export default useListField;


