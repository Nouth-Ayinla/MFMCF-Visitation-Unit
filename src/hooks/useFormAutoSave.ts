import { useEffect, useCallback } from "react";
import { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";

interface UseFormAutoSaveOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  key: string;
  debounceMs?: number;
}

export function useFormAutoSave<T extends FieldValues>({
  form,
  key,
  debounceMs = 500,
}: UseFormAutoSaveOptions<T>) {
  const storageKey = `form_autosave_${key}`;

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        Object.entries(parsed).forEach(([field, value]) => {
          form.setValue(field as Path<T>, value as PathValue<T, Path<T>>, { shouldDirty: false });
        });
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  // Watch all form values and save on change
  const watchedValues = form.watch();

  useEffect(() => {
    const handler = setTimeout(() => {
      const hasValues = Object.values(watchedValues).some(
        (v) => v !== undefined && v !== "" && v !== false
      );
      if (hasValues) {
        localStorage.setItem(storageKey, JSON.stringify(watchedValues));
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [watchedValues, storageKey, debounceMs]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { clearSavedData };
}
