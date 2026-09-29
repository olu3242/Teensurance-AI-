"use client";

import {
  useEffect,
  useState
} from "react";

type DashboardOption = {
  id: string;
  label: string;
};

type Props = {
  storageKey: string;
  options: DashboardOption[];
  onChange: (ids: string[]) => void;
};

export function DashboardCustomizer({
  storageKey,
  options,
  onChange
}: Props) {
  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState<string[]>(
    options.map((option) => option.id)
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) return;

    try {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            options.some((option) => option.id === item)
        );

        setSelected(valid);
        onChange(valid);
      }
    } catch {
      // Invalid local customization is ignored safely.
    }
  }, [storageKey, options, onChange]);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];

    setSelected(next);

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(next)
    );

    onChange(next);
  }

  return (
    <div className="dashCustomize">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        Customize dashboard
      </button>

      {open && (
        <div className="dashCustomizePanel">
          {options.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
              />

              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
