# OpGo!!

## File formats

- .opgo: Default OpGo!! project file. Plain-text instructions in OpGo!! syntax. Lines typically end with `;` as a statement terminator. Saved and opened directly without conversion.
- .mpc: Legacy 8085 simulator export/import format. When saving with `.mpc`, content is wrapped in the required RTF-like structure for GNUSim8085/Vikas-style tools. When opening `.mpc`, the wrapper is removed to recover instructions.
- .opg: Custom project extension for branding (alias of `.opgo`). You can rename `.opgo` to `.opg` interchangeably. Both are treated as the same plain-text format.

## Export utilities

- Export as .asm: Converts `.opgo` code to standard assembly by line-wise cleanup.
  - Rule: For each line, remove a single trailing `;` (if present) and trim trailing whitespace.
  - Output keeps original line order and internal spacing.

- Export as .hex: Placeholder machine code export for hardware kits. The current build emits a commented placeholder file until a full assembler is integrated.

## Notes

- Open dialog accepts `.opgo` and `.mpc` files.
- Save defaults to `.opgo`. If you explicitly choose `.mpc`, conversion to simulator RTF format is applied.
