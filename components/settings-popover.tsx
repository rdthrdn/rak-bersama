"use client";

import type { ReaderTheme } from "@/components/reader";

type SettingsPopoverProps = {
  open: boolean;
  theme: ReaderTheme;
  fontSize: number;
  lineHeight: number;
  onThemeChange: (theme: ReaderTheme) => void;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
};

const themes: { id: ReaderTheme; label: string }[] = [
  { id: "ink", label: "Ink" },
  { id: "sepia", label: "Sepia" },
  { id: "cream", label: "Cream" },
];

export function SettingsPopover({
  open,
  theme,
  fontSize,
  lineHeight,
  onThemeChange,
  onFontSizeChange,
  onLineHeightChange,
}: SettingsPopoverProps) {
  if (!open) return null;

  return (
    <section className="settings-popover" role="dialog" aria-label="Pengaturan tampilan">
      <p className="settings-title">Tampilan baca</p>

      <fieldset className="setting-group">
        <legend>Tema</legend>
        <div className="theme-options">
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={"theme-option theme-" + option.id + (theme === option.id ? " is-selected" : "")}
              aria-pressed={theme === option.id}
              onClick={() => onThemeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="range-setting">
        <span>Ukuran teks <output>{fontSize}px</output></span>
        <input
          type="range"
          min="16"
          max="26"
          step="1"
          value={fontSize}
          onChange={(event) => onFontSizeChange(Number(event.target.value))}
        />
      </label>

      <label className="range-setting">
        <span>Jarak baris <output>{lineHeight.toFixed(1)}</output></span>
        <input
          type="range"
          min="1.5"
          max="2.1"
          step="0.1"
          value={lineHeight}
          onChange={(event) => onLineHeightChange(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
