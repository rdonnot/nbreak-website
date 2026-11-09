# Public API

The generated declarations in `dist/` are authoritative. Every component is exported from `@nbrain/ui`; the widget-specific view exports are also available at `@nbrain/ui/widgets`.

| Entry | Contract |
|---|---|
| NBrainProvider | One application provider; theme dark/light, density comfortable/compact, glow 0..1, motion boolean. System reduced motion is respected. |
| NumericScrub | Controlled numeric value, min/max/step/unit/defaultValue; keyboard, horizontal drag and reset. Shift-drag gives finer increments. |
| ParameterRow | Label, hint, child control, modified marker and optional reset callback. |
| WidgetFrame | Title, registry ID, active/state/pinned/dock, controlled lifecycle callbacks; ready/loading/empty/error/offline presentation. |
| DockPicker | Controlled free/left/right/top/bottom/fill selection. Parent performs layout. |
| ConnectionBanner | Connected/reconnecting/offline status and optional reconnect callback. |
| WidgetView | widgetId, WidgetValue, onValueChange; optional items/messages/samples/actions/description; children are the real engine surface. |
| WidgetValue | Scalar, text, enabled, color, joystick point, transform XYZ, playing and optional selectedId. Controlled by the host. |
| WidgetItem | id/label; optional detail/status/progress/children/color. |
| WidgetMessage | id, human/agent role, name, text. |
| getWidgetDefinition | Original registry metadata plus presentation kind and implementation status. |
| widgetCatalog | 74 exact registry IDs with original dimensions/categories and implementation classification. |
| SliderWidget / FaderWidget / NumericWidget | Controlled scalar values. |
| ButtonWidget / ToggleWidget / TextWidget / ColorWidget | Controlled trigger, boolean, text or color input. |
| JoystickWidget / CurveWidget / TransformWidget | Controlled point, tension scalar or XYZ values. |
| ScopeWidget / MeterWidget | Supplied telemetry samples/level; no live transport. |
| AssetGridWidget / TreeWidget / QueueWidget | Supplied items, selection/action callbacks; Tree owns disclosure state. |
| ChatWidget | Supplied messages, send callback; owns only the draft composer text. |
| EngineViewport | Header/footer slots and renderer children; no Three, map, audio or NLE runtime dependency. |
| Density | `data-nbrain-density="compact"` on any ancestor, or `<DensityScope density fontScale asContext>`; `useDensity()`. Compact = xs controls, 24 px inputs, 11-12 px text x `--nb-font-scale`. Popups opened inside a DensityScope inherit it. |
| Button sizes | `xs`, `sm`, `md`, `lg`, `icon`, `icon-xs`. |
| IconButton | `aria-label` (required), `icon`, `size` xs/sm/md, `tooltip` (default the label, `false` = none), `pressed`, plus Button props. |
| SegmentedControl | `items` ({value,label,icon?,tooltip?,disabled?}), `value`, `onValueChange`, `label` (group name), `iconOnly`, `size`. |
| Select / DropdownMenu / Popover / Sheet parts | See CHANGELOG 0.6.0 for the part list; roots are `SelectRoot`, `DropdownMenuRoot`, `PopoverRoot`, `SheetRoot`. Props follow the shadcn Base UI wrappers (`SelectTrigger size`, `DropdownMenuItem variant="destructive"`, `SheetContent side showCloseButton`, ...). Menu labels must sit inside a `*Group`. |
| ContextMenu | `items`: `{label,onClick,icon,shortcut,danger,disabled,checked,children}` or `{type:'separator'}` / `{type:'label',label}`; `disabled` turns the trigger into a plain wrapper. |
| toast | `toast({id,kind,title,message,description,action,actions,progress,timeout})` returns the id; same id replaces in place; `toast.update(id,patch)`; `.dismiss(id)`, `.dismissAll()`, `.error/.success/.info/.warning(message,title?,opts?)`. Kinds: info, success, warning, error, running (sticky). Render `<ToastHost max/>` once (or `ToastProvider`). |
| CSS entry points | `@nbrain/ui/styles.css` (all) or `@nbrain/ui/styles/base.css` + only the component files you use: `radial`, `tabstrip`, `choice`, `window`, `widgets`, `production`. |

## Action boundary

`WidgetView.onAction(action, id?)` reports intent. Action names currently include execute, files-selected, inspect, save, send-message, fit, export, approve and revise. `send-message` uses the second argument for submitted text. The host maps these intents to its existing command/MCP/aiohttp system. No action is automatically approved by this package.

The initial common router is useful for visual migration. For strongly typed feature-specific execution, prefer the individual components and adapters around your existing domain commands. Do not use free-form string actions as a substitute for your application’s command types.

## Accessible states

Headless controls and modal/menu primitives use Base UI. Numeric and joystick controls offer keyboard alternatives. Error/offline states expose meaningful status/alert text. The demo hides inert thumbnail controls from assistive technology and provides one focusable open button per card.

Tree rows use standard disclosure and selection buttons; they are not an ARIA treeview implementation with roving arrow-key navigation. The schedule and graph are presentation compositions; production dragging, ports, virtualized lists and engine shortcuts remain with the host. Do not advertise them as complete feature engines.
| NativeSelect | A real `<select>` (props = `SelectHTMLAttributes`, children are `<option>`/`<optgroup>`), `ref` to the select, `size` `xs`/`sm`/`md` (24 / 32 px / follows density; the native `size` attribute is `htmlSize`). Custom chevron, same look as `Input`. Use `Select` for the Base UI popup one. |
| Input / Textarea | `size` `xs`/`sm`/`md` added (BREAKING for a numeric `size`: use `htmlSize`). `type` date, time, datetime-local, number and search are styled (picker icon follows the theme, spinners reserve their space). |
| Checkbox / Switch | Base UI. `label` is now optional, but then `aria-label` or `aria-labelledby` is required (types). Props: `checked`, `defaultChecked`, `onCheckedChange`, `indeterminate` (Checkbox), `id`/`name` (reach the hidden input), `disabled`, `data-*`, `aria-*`, `className`, `ref`. No native `onChange`: use `CheckInput`/`SwitchInput`. |
| CheckInput / SwitchInput | Native `<input type="checkbox">` (SwitchInput: `role="switch"`), all input props, native `onChange(e)`, `checked`/`defaultChecked`, `ref` to the input, `indeterminate` (CheckInput, sets the DOM property), optional `label` (wraps in a `<label>`). Pick these in forms and dense widget UIs migrated from raw inputs; pick `Checkbox`/`Switch` for the Base UI look and `onCheckedChange`. |
| Radio | One native `<input type="radio">`, all input props, optional `label`. Group by sharing `name`. `RadioGroup` is unchanged. |
| RangeInput | Native `<input type="range">` with token-coloured track/thumb; the filled part is `--nb-range-pct` (set from value/min/max, controlled or not; webkit and moz). `size`, all input props. `Slider` (labelled, Base UI) is unchanged. |
| ColorInput | Native `<input type="color">` swatch without the default chrome, `size` `xs` 20 / `sm` 28 / `md` 36 px, all input props. |
| FileInput | Native `<input type="file">` (visually hidden but in the DOM and focusable) plus a Button-looking trigger and the chosen name(s). `buttonLabel`, `placeholder`, `size`, `accept`, `multiple`, `onChange`; `ref` is the input (`ref.current.click()` opens the picker); `className`/`style` go to the wrapper, every other prop to the input. |

## DataGrid (0.8)

```tsx
const col = createColumnHelper<Job>();
const columns = [
  col.accessor("name", { header: "Name", meta: { grow: true } }),
  col.accessor("status", { header: "Status", meta: { facet: true }, cell: i => <Badge>{i.getValue()}</Badge> }),
  col.accessor("size", { header: "Size", meta: { align: "right", mono: true }, sortingFn: "basic" }),
];
<DataGrid data={jobs} columns={columns} getRowId={j => j.id} label="Jobs" search selectable exportName="jobs"
  persistKey="jobs" height="fill" onRowClick={r => open(r.original)} />
```

Props: `data, columns, getRowId, label, search, toolbar, actions, columnMenu, densityToggle, exportName, hideToolbar,
initialState, onStateChange, persistKey, manualSorting, resizable, reorderable, selectable, rowSelection,
onRowSelectionChange, activeRowId, onRowClick, onRowDoubleClick, onRowContextMenu, rowProps, getSubRows, renderSubRow,
canExpand, expanded, onExpandedChange, groupLabel, groupsOpen, height ('fill' | px), stickyHeader, striped,
virtualRowHeight, pageSize, loading, empty, className`. Group a column with `enableGrouping: true` on its definition and
`aggregationFn` + `aggregatedCell` for the totals on the group row. A column's `footer` fills a sticky footer row.
