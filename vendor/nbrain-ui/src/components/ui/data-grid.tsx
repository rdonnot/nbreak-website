import * as React from 'react';
import {
  flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getGroupedRowModel, getExpandedRowModel,
  getPaginationRowModel, getFacetedRowModel, getFacetedUniqueValues, useReactTable,
  type ColumnDef, type ColumnFiltersState, type ColumnOrderState, type ColumnPinningState, type ColumnSizingState,
  type ExpandedState, type GroupingState, type Row, type RowSelectionState, type SortingState, type Table,
  type VisibilityState, type Header, type Column,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {
  ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronsUpDown, Columns3, Download, EyeOff, Group, MoreHorizontal, PinOff,
  Pin, Rows3, Search, X, Filter,
} from 'lucide-react';
import {cn} from '../../lib/utils';
import {Input, Skeleton, Tooltip} from './primitives';
import {CheckInput} from './native-controls';
import {IconButton} from './icon-controls';
import {
  DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
} from './compound';
import {useDensityProps} from './density';

export type {
  ColumnDef, Row as DataGridRow, Table as DataGridTable, SortingState, VisibilityState, ColumnSizingState,
  ColumnPinningState, GroupingState, ExpandedState, RowSelectionState, ColumnFiltersState, ColumnOrderState,
} from '@tanstack/react-table';
export {createColumnHelper} from '@tanstack/react-table';

/** What a column may say about itself, beside TanStack's own column definition (`columnDef.meta`). */
export interface DataGridColumnMeta {
  align?: 'left' | 'right' | 'center';
  /** Tabular, monospaced figures: sizes, durations, counts, ids. */
  mono?: boolean;
  /** Takes whatever width the other columns leave. One per grid; without one the last column does. */
  grow?: boolean;
  /** Tooltip on the header (what the column means, its unit). */
  title?: string;
  /** Extra class on every cell of the column. */
  className?: string;
  /** Header menu offers a "show only…" list of the column's distinct values. */
  facet?: boolean;
  /** CSV text of a cell. Default: the cell value as text. */
  exportValue?: (row: unknown) => string;
}
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> extends DataGridColumnMeta {}
}

/** Everything a person set on the grid; hand it back as `initialState` to restore the view. */
export interface DataGridState {
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnFilters: ColumnFiltersState;
  grouping: GroupingState;
  globalFilter: string;
  density: 'comfortable' | 'compact';
}

export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  getRowId?: (row: T, index: number, parent?: Row<T>) => string;
  /** Accessible name; also the CSV file name. */
  label?: string;

  // ── toolbar ──
  /** Search box over every column. `true` or the placeholder. */
  search?: boolean | string;
  /** Left of the toolbar, after the search box. */
  toolbar?: React.ReactNode;
  /** Right of the toolbar, before the menus. */
  actions?: React.ReactNode;
  /** Columns menu (show/hide, reset). Default true. */
  columnMenu?: boolean;
  densityToggle?: boolean;
  /** Adds an "Export CSV" button; the value is the file name. */
  exportName?: string;
  hideToolbar?: boolean;

  // ── view state ──
  initialState?: Partial<DataGridState>;
  /** Called with the whole state each time a person changes it (sorting, widths, hidden columns…). */
  onStateChange?: (state: DataGridState) => void;
  /** Convenience: keep the state in localStorage under this key. */
  persistKey?: string;
  /** Sort in the data as given; a person's header clicks still call `onStateChange`. */
  manualSorting?: boolean;
  resizable?: boolean;
  /** Columns the host keeps off (nothing to show in them yet): hidden whatever the person chose, and left out of the Columns menu. */
  hiddenColumns?: string[];
  /** Grouping owned by the host (a toggle outside the grid). Without it the person groups from a header menu. */
  grouping?: string[];
  /** Columns that may be dragged to a new place (header drag). */
  reorderable?: boolean;

  // ── rows ──
  /** A checkbox column. `'single'` selects one at a time. */
  selectable?: boolean | 'single';
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState, rows: T[]) => void;
  /** The row a side pane is showing: drawn as current without being selected. */
  activeRowId?: string | null;
  onRowClick?: (row: Row<T>, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: Row<T>, event: React.MouseEvent) => void;
  onRowContextMenu?: (row: Row<T>, event: React.MouseEvent) => void;
  /** Extra props for a row: className, data-*, draggable and its handlers. */
  rowProps?: (row: Row<T>) => React.HTMLAttributes<HTMLTableRowElement> & Record<`data-${string}`, unknown>;
  /** Children of a row (a tree): the chevron appears on the column with `meta.tree`-style `TreeCell`. */
  getSubRows?: (row: T) => T[] | undefined;
  /** A pane under an opened row. Adds the chevron column. */
  renderSubRow?: (row: Row<T>) => React.ReactNode;
  /** A click on a row (not on a control in it) opens its pane. */
  detailOnRowClick?: boolean;
  canExpand?: (row: Row<T>) => boolean;
  expanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
  /** A group row's title; default is the value and the count. */
  groupLabel?: (row: Row<T>) => React.ReactNode;
  /** Rows start grouped open (default true). */
  groupsOpen?: boolean;

  // ── layout ──
  /** `fill`: take the parent's height and scroll inside. A number is a max height in px. */
  height?: 'fill' | number;
  stickyHeader?: boolean;
  striped?: boolean;
  /** Row height in px for the virtual scroller; leave out to render every row. */
  virtualRowHeight?: number;
  /** Rows per page; leave out for one long list. */
  pageSize?: number;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

const readStored = (key?: string): Partial<DataGridState> => {
  if (!key) return {};
  try { return JSON.parse(localStorage.getItem('nb-grid:' + key) || '{}'); } catch { return {}; }
};
const writeStored = (key: string, s: DataGridState) => {
  try { localStorage.setItem('nb-grid:' + key, JSON.stringify({...s, globalFilter: undefined, columnFilters: undefined})); } catch { /* private window */ }
};

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
function exportCsv<T>(table: Table<T>, name: string) {
  const cols = table.getVisibleLeafColumns().filter(c => c.id !== '__select' && c.id !== '__expand');
  const head = cols.map(c => csvCell(typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
  const lines = table.getPrePaginationRowModel().rows.filter(r => !r.getIsGrouped()).map(r => cols.map(c => {
    const custom = c.columnDef.meta?.exportValue;
    const v = custom ? custom(r.original) : r.getValue(c.id);
    return csvCell(v == null ? '' : String(v));
  }).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], {type: 'text/csv'}));
  const a = document.createElement('a');
  a.href = url; a.download = name.replace(/\.csv$/, '') + '.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The chevron and indent of a tree row: put it first inside the cell that names the row. */
export function TreeCell<T>({row, children}: {row: Row<T>; children: React.ReactNode}) {
  const can = row.getCanExpand();
  return (
    <span className="nb-grid-tree" style={{paddingLeft: row.depth * 14}}>
      {can
        ? <button type="button" className="nb-grid-chevron" aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
            aria-expanded={row.getIsExpanded()} onClick={e => { e.stopPropagation(); row.toggleExpanded(); }}>
            {row.getIsExpanded() ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
          </button>
        : <span className="nb-grid-chevron" aria-hidden="true"/>}
      {children}
    </span>
  );
}

function pinStyle<T>(col: Column<T>): React.CSSProperties {
  const side = col.getIsPinned();
  if (!side) return {};
  return side === 'left' ? {position: 'sticky', left: col.getStart('left')} : {position: 'sticky', right: col.getAfter('right')};
}

function HeaderMenu<T>({header, onGroup}: {header: Header<T, unknown>; onGroup: boolean}) {
  const col = header.column;
  const d = useDensityProps();
  const facets = col.columnDef.meta?.facet ? [...col.getFacetedUniqueValues().entries()].filter(([k]) => k != null && k !== '').sort((a, b) => String(a[0]).localeCompare(String(b[0]))) : [];
  const chosen = (col.getFilterValue() as unknown[] | undefined) ?? [];
  const toggle = (v: unknown) => {
    const next = chosen.includes(v) ? chosen.filter(x => x !== v) : [...chosen, v];
    col.setFilterValue(next.length ? next : undefined);
  };
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger className="nb-grid-hmenu" aria-label={'Column options: ' + col.id} data-active={chosen.length ? '' : undefined}
        onClick={e => e.stopPropagation()}>
        {chosen.length ? <Filter size={11}/> : <MoreHorizontal size={12}/>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" {...d}>
        {col.getCanSort() && <>
          <DropdownMenuItem onClick={() => col.toggleSorting(false)}><ArrowUp size={13}/> Sort ascending</DropdownMenuItem>
          <DropdownMenuItem onClick={() => col.toggleSorting(true)}><ArrowDown size={13}/> Sort descending</DropdownMenuItem>
          {col.getIsSorted() && <DropdownMenuItem onClick={() => col.clearSorting()}><X size={13}/> Clear sort</DropdownMenuItem>}
          <DropdownMenuSeparator/>
        </>}
        {onGroup && col.getCanGroup() && (
          <DropdownMenuItem onClick={() => col.toggleGrouping()}><Group size={13}/> {col.getIsGrouped() ? 'Ungroup' : 'Group by this'}</DropdownMenuItem>
        )}
        {col.getCanPin() && (col.getIsPinned()
          ? <DropdownMenuItem onClick={() => col.pin(false)}><PinOff size={13}/> Unpin</DropdownMenuItem>
          : <>
              <DropdownMenuItem onClick={() => col.pin('left')}><Pin size={13}/> Pin left</DropdownMenuItem>
              <DropdownMenuItem onClick={() => col.pin('right')}><Pin size={13}/> Pin right</DropdownMenuItem>
            </>)}
        {col.getCanHide() && <DropdownMenuItem onClick={() => col.toggleVisibility(false)}><EyeOff size={13}/> Hide column</DropdownMenuItem>}
        {facets.length > 0 && <>
          <DropdownMenuSeparator/>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Show only</DropdownMenuLabel>
            {facets.slice(0, 14).map(([v, n]) => (
              <DropdownMenuCheckboxItem key={String(v)} checked={chosen.includes(v)} onCheckedChange={() => toggle(v)} closeOnClick={false}>
                {String(v)} <span className="nb-grid-facet-n">{n}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {chosen.length > 0 && <DropdownMenuItem onClick={() => col.setFilterValue(undefined)}><X size={13}/> Clear filter</DropdownMenuItem>}
          </DropdownMenuGroup>
        </>}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

function ColumnsMenu<T>({table, skip}: {table: Table<T>; skip?: string[]}) {
  const d = useDensityProps();
  const cols = table.getAllLeafColumns().filter(c => c.getCanHide() && !skip?.includes(c.id));
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger className="nb-grid-iconbtn" aria-label="Columns" title="Columns"><Columns3 size={14}/></DropdownMenuTrigger>
      <DropdownMenuContent align="end" {...d}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          {cols.map(c => (
            <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} closeOnClick={false} onCheckedChange={v => c.toggleVisibility(!!v)}>
              {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={() => { table.resetColumnVisibility(); table.resetColumnSizing(); table.resetColumnPinning(); table.resetColumnOrder(); table.resetGrouping(); }}>
          Reset the view
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

const SELECT_ID = '__select';
const EXPAND_ID = '__expand';

/**
 * A data grid on TanStack Table: sort (shift-click for several), search, show-only facets, group, pin, hide, resize
 * (double-click a handle to restore), reorder, select (shift-click a range), expand a row into a pane or a tree,
 * page or virtualise, export CSV, comfortable/compact — in the library's look and density.
 * The component owns the view state (sorting, widths…) and reports it through `onStateChange` / `persistKey`.
 */
export function DataGrid<T>(props: DataGridProps<T>) {
  const {
    data, columns, getRowId, label = 'Table', search, toolbar, actions, columnMenu = true, densityToggle = true, exportName,
    hideToolbar, initialState, onStateChange, persistKey, manualSorting, resizable = true, hiddenColumns, grouping: groupingProp, reorderable, selectable,
    rowSelection: selectionProp, onRowSelectionChange, activeRowId, onRowClick, onRowDoubleClick, onRowContextMenu, rowProps,
    getSubRows, renderSubRow, detailOnRowClick, canExpand, expanded: expandedProp, onExpandedChange, groupLabel, groupsOpen = true,
    height, stickyHeader = true, striped, virtualRowHeight, pageSize, loading, empty, className, style,
  } = props;
  const stored = React.useMemo(() => ({...initialState, ...readStored(persistKey)}), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [sorting, setSorting] = React.useState<SortingState>(stored.sorting ?? []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(stored.columnVisibility ?? {});
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(stored.columnSizing ?? {});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(stored.columnPinning ?? {});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(stored.columnOrder ?? []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(stored.columnFilters ?? []);
  const [ownGrouping, setGrouping] = React.useState<GroupingState>(stored.grouping ?? []);
  const grouping = groupingProp ?? ownGrouping;
  const [globalFilter, setGlobalFilter] = React.useState(stored.globalFilter ?? '');
  const [density, setDensity] = React.useState<DataGridState['density']>(stored.density ?? 'compact');
  const [ownSelection, setOwnSelection] = React.useState<RowSelectionState>({});
  const [ownExpanded, setOwnExpanded] = React.useState<ExpandedState>(groupsOpen && !getSubRows ? true : {});
  const [openRows, setOpenRows] = React.useState<Record<string, boolean>>({});
  const toggleDetail = React.useCallback((id: string) => setOpenRows(o => ({...o, [id]: !o[id]})), []);
  const [pagination, setPagination] = React.useState({pageIndex: 0, pageSize: pageSize ?? 1_000_000});
  const lastClicked = React.useRef<string | null>(null);
  const openRowsRef = React.useRef<Record<string, boolean>>({});
  const selectRef = React.useRef<(row: Row<T>, shift: boolean, fromBox?: boolean) => void>(() => undefined);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dens = useDensityProps();

  const rowSelection = selectionProp ?? ownSelection;
  const expanded = expandedProp ?? ownExpanded;
  const single = selectable === 'single';

  const allColumns = React.useMemo<ColumnDef<T, any>[]>(() => {
    const lead: ColumnDef<T, any>[] = [];
    if (renderSubRow) {
      lead.push({
        id: EXPAND_ID, size: 26, enableResizing: false, enableSorting: false, enableHiding: false, enablePinning: false,
        header: () => null,
        cell: ({row}) => row.getIsGrouped() ? null
          : <button type="button" className="nb-grid-chevron" aria-label={openRowsRef.current[row.id] ? 'Collapse row' : 'Expand row'} aria-expanded={!!openRowsRef.current[row.id]}
              onClick={e => { e.stopPropagation(); toggleDetail(row.id); }}>{openRowsRef.current[row.id] ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>,
      });
    }
    if (selectable) {
      lead.push({
        id: SELECT_ID, size: 30, enableResizing: false, enableSorting: false, enableHiding: false, enablePinning: false, enableGrouping: false,
        header: ({table}) => single ? null : (
          <CheckInput aria-label={'Select all ' + label.toLowerCase()} checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()}/>
        ),
        cell: ({row}) => row.getIsGrouped() ? null : (
          <CheckInput aria-label={'Select row ' + row.id} checked={row.getIsSelected()} disabled={!row.getCanSelect()}
            onClick={e => { e.stopPropagation(); selectRef.current(row, e.shiftKey, true); }} onChange={() => undefined}/>
        ),
      });
    }
    return [...lead, ...columns];
  }, [columns, selectable, single, renderSubRow, label, openRows, toggleDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  const forcedOff = React.useMemo(() => hiddenColumns?.length ? Object.fromEntries(hiddenColumns.map(id => [id, false])) : null, [hiddenColumns?.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const table = useReactTable<T>({
    data, columns: allColumns, getRowId,
    initialState: {sorting: initialState?.sorting, columnVisibility: initialState?.columnVisibility, columnPinning: initialState?.columnPinning, columnOrder: initialState?.columnOrder, grouping: initialState?.grouping},
    state: {sorting, columnVisibility: forcedOff ? {...columnVisibility, ...forcedOff} : columnVisibility, columnSizing, columnPinning, columnOrder, columnFilters, grouping, globalFilter, rowSelection, expanded, pagination},
    onSortingChange: setSorting, onColumnVisibilityChange: setColumnVisibility, onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning, onColumnOrderChange: setColumnOrder, onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping, onGlobalFilterChange: setGlobalFilter, onPaginationChange: setPagination,
    onRowSelectionChange: u => {
      const next = typeof u === 'function' ? u(rowSelection) : u;
      if (onRowSelectionChange) onRowSelectionChange(next, data.filter((r, i) => next[getRowId ? getRowId(r, i) : String(i)]));
      else setOwnSelection(next);
    },
    onExpandedChange: u => {
      const next = typeof u === 'function' ? u(expanded) : u;
      if (onExpandedChange) onExpandedChange(next); else setOwnExpanded(next);
    },
    getSubRows, getRowCanExpand: row => (canExpand ? canExpand(row) : (row.subRows?.length ?? 0) > 0),
    enableMultiRowSelection: !single, enableColumnResizing: resizable, columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getFacetedRowModel: getFacetedRowModel(), getFacetedUniqueValues: getFacetedUniqueValues(),
    getGroupedRowModel: getGroupedRowModel(), getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: pageSize ? getPaginationRowModel() : undefined,
    manualSorting, autoResetPageIndex: false, autoResetExpanded: false,
    defaultColumn: {minSize: 36, size: 120, filterFn: 'arrIncludesSome'},
    globalFilterFn: 'includesString',
  });

  // ── report the view state ──
  const snapshot: DataGridState = {sorting, columnVisibility, columnSizing, columnPinning, columnOrder, columnFilters, grouping, globalFilter, density};
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    onStateChange?.(snapshot);
    if (persistKey) writeStored(persistKey, snapshot);
  }, [sorting, columnVisibility, columnSizing, columnPinning, columnOrder, columnFilters, grouping, globalFilter, density]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = table.getRowModel().rows;
  const flatLeaf = React.useMemo(() => rows.filter(r => !r.getIsGrouped()), [rows]);

  function selectRow(row: Row<T>, shift: boolean, fromBox = false) {
    if (!selectable) return;
    if (single) { table.setRowSelection(row.getIsSelected() ? {} : {[row.id]: true}); lastClicked.current = row.id; return; }
    if (shift && lastClicked.current) {
      const a = flatLeaf.findIndex(r => r.id === lastClicked.current), b = flatLeaf.findIndex(r => r.id === row.id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const next = {...rowSelection};
        for (let i = lo; i <= hi; i++) next[flatLeaf[i].id] = true;
        table.setRowSelection(next);
        return;
      }
    }
    if (!fromBox) table.setRowSelection({[row.id]: true}); else row.toggleSelected();
    lastClicked.current = row.id;
  }

  selectRef.current = selectRow;
  openRowsRef.current = openRows;

  // ── virtual window ──
  const virtual = !!virtualRowHeight && !renderSubRow;
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0, getScrollElement: () => scrollRef.current, estimateSize: () => virtualRowHeight || 28, overscan: 12,
  });
  const vItems = virtual ? virtualizer.getVirtualItems() : [];
  const padTop = virtual && vItems.length ? vItems[0].start : 0;
  const padBottom = virtual && vItems.length ? virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0;
  const shown = virtual ? vItems.map(v => rows[v.index]) : rows;

  // ── keyboard: arrows walk the rows, space ticks, enter opens ──
  const [cursor, setCursor] = React.useState<string | null>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input,button,[role=menuitem]') && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (!flatLeaf.length) return;
    const at = flatLeaf.findIndex(r => r.id === (cursor ?? activeRowId));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = flatLeaf[Math.min(flatLeaf.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)))];
      setCursor(next.id);
      if (virtual) virtualizer.scrollToIndex(rows.indexOf(next));
      scrollRef.current?.querySelector(`[data-row-id="${CSS.escape(next.id)}"]`)?.scrollIntoView({block: 'nearest'});
    } else if (e.key === ' ' && at >= 0 && selectable) {
      e.preventDefault(); selectRow(flatLeaf[at], e.shiftKey, true);
    } else if (e.key === 'Enter' && at >= 0) {
      onRowClick?.(flatLeaf[at], e as unknown as React.MouseEvent);
    }
  };

  const leafCols = table.getVisibleLeafColumns();
  const hasFooter = leafCols.some(c => c.columnDef.footer);
  const growId = (leafCols.find(c => c.columnDef.meta?.grow) ?? leafCols[leafCols.length - 1])?.id;
  const totalFixed = leafCols.reduce((n, c) => n + (c.id === growId ? 0 : c.getSize()), 0);
  const groupable = columns.some(c => (c as {enableGrouping?: boolean}).enableGrouping);
  const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length;
  const dragCol = React.useRef<string | null>(null);

  const headerGroup = table.getHeaderGroups()[0];
  const colSpan = leafCols.length;
  const sizeStyle = (c: Column<T>): React.CSSProperties => (c.id === growId ? {} : {width: c.getSize()});

  const showToolbar = !hideToolbar && (search || toolbar || actions || columnMenu || densityToggle || exportName || selectedCount > 0);
  const filtersOn = columnFilters.length > 0 || !!globalFilter;

  return (
    <div className={cn('nb-grid', className)} data-density={density} data-striped={striped ? '' : undefined}
      data-height={height === 'fill' ? 'fill' : undefined} data-testid={props['data-testid']} {...dens}
      style={{...dens.style, ...style}}>
      {showToolbar && (
        <div className="nb-grid-toolbar">
          {search && (
            <div className="nb-grid-search">
              <Search size={13}/>
              <Input size="xs" aria-label={'Search ' + label.toLowerCase()} placeholder={typeof search === 'string' ? search : 'Search…'}
                value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}/>
              {globalFilter && <button type="button" aria-label="Clear search" className="nb-grid-clear" onClick={() => setGlobalFilter('')}><X size={12}/></button>}
            </div>
          )}
          {toolbar}
          {selectedCount > 0 && (
            <span className="nb-grid-count" data-testid="grid-selected">{selectedCount} selected
              <button type="button" onClick={() => table.resetRowSelection()}>Clear</button></span>
          )}
          {filtersOn && (
            <span className="nb-grid-count">{table.getPrePaginationRowModel().flatRows.filter(r => !r.getIsGrouped()).length} of {data.length}
              <button type="button" onClick={() => { setColumnFilters([]); setGlobalFilter(''); }}>Reset filters</button></span>
          )}
          <span className="nb-grid-spacer"/>
          {actions}
          {grouping.some(g => table.getColumn(g)?.getIsVisible()) && (
            <button type="button" className="nb-grid-chip" onClick={() => setGrouping([])} title="Remove the grouping">
              <Group size={11}/> {grouping.map(g => table.getColumn(g)?.columnDef.header).filter(h => typeof h === 'string').join(' › ') || 'Grouped'} <X size={10}/>
            </button>
          )}
          {densityToggle && (
            <IconButton size="sm" aria-label={density === 'compact' ? 'Comfortable rows' : 'Compact rows'} icon={<Rows3 size={14}/>}
              pressed={density === 'comfortable'} onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}/>
          )}
          {exportName && <IconButton size="sm" aria-label="Export CSV" icon={<Download size={14}/>} onClick={() => exportCsv(table, exportName)}/>}
          {columnMenu && <ColumnsMenu table={table} skip={hiddenColumns}/>}
        </div>
      )}

      <div ref={scrollRef} className="nb-grid-scroll" role="region" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}
        style={typeof height === 'number' ? {maxHeight: height} : undefined}>
        <table className="nb-grid-table" role="grid" aria-rowcount={rows.length} aria-multiselectable={selectable && !single ? true : undefined}
          style={{minWidth: totalFixed + 60}}>
          <colgroup>{leafCols.map(c => <col key={c.id} style={sizeStyle(c)}/>)}</colgroup>
          <thead data-sticky={stickyHeader ? '' : undefined}>
            {headerGroup && (
              <tr>
                {headerGroup.headers.map(h => {
                  const c = h.column, meta = c.columnDef.meta, sorted = c.getIsSorted();
                  const isUtility = c.id === SELECT_ID || c.id === EXPAND_ID;
                  const title = meta?.title;
                  const content = h.isPlaceholder ? null : flexRender(c.columnDef.header, h.getContext());
                  return (
                    <th key={h.id} scope="col" data-align={meta?.align} data-pinned={c.getIsPinned() || undefined}
                      data-sortable={c.getCanSort() ? '' : undefined} data-sorted={sorted || undefined}
                      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : c.getCanSort() ? 'none' : undefined}
                      style={pinStyle(c)} title={title}
                      draggable={reorderable && !isUtility ? true : undefined}
                      onDragStart={reorderable ? () => { dragCol.current = c.id; } : undefined}
                      onDragOver={reorderable ? e => { if (dragCol.current) e.preventDefault(); } : undefined}
                      onDrop={reorderable ? () => {
                        const from = dragCol.current; dragCol.current = null;
                        if (!from || from === c.id) return;
                        const ids = table.getVisibleLeafColumns().map(x => x.id).filter(id => id !== from);
                        ids.splice(ids.indexOf(c.id) + (table.getVisibleLeafColumns().findIndex(x => x.id === from) < table.getVisibleLeafColumns().findIndex(x => x.id === c.id) ? 1 : 0), 0, from);
                        setColumnOrder(ids);
                      } : undefined}>
                      <div className="nb-grid-th">
                        {c.getCanSort() && !isUtility
                          ? <button type="button" className="nb-grid-sort" onClick={c.getToggleSortingHandler()}>
                              <span className="nb-grid-th-text">{content}</span>
                              {sorted === 'asc' ? <ArrowUp size={11}/> : sorted === 'desc' ? <ArrowDown size={11}/> : <ChevronsUpDown size={11} className="nb-grid-sort-idle"/>}
                              {sorted && sorting.length > 1 && <sup>{sorting.findIndex(s => s.id === c.id) + 1}</sup>}
                            </button>
                          : <span className="nb-grid-th-text">{content}</span>}
                        {!isUtility && (c.getCanSort() || c.getCanHide() || c.getCanPin() || meta?.facet) && <HeaderMenu header={h} onGroup={groupable}/>}
                      </div>
                      {resizable && c.getCanResize() && (
                        <div className="nb-grid-resize" data-resizing={c.getIsResizing() || undefined} role="separator" aria-orientation="vertical"
                          aria-label={'Resize ' + c.id} onMouseDown={h.getResizeHandler()} onTouchStart={h.getResizeHandler()}
                          onDoubleClick={() => c.resetSize()} onClick={e => e.stopPropagation()}/>
                      )}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {loading && !rows.length && Array.from({length: 6}, (_, i) => (
              <tr key={'sk' + i} className="nb-grid-skeleton">{leafCols.map(c => <td key={c.id}><Skeleton className="nb-grid-sk"/></td>)}</tr>
            ))}
            {padTop > 0 && <tr aria-hidden="true" style={{height: padTop}}><td colSpan={colSpan}/></tr>}
            {shown.map(row => {
              if (row.getIsGrouped()) {
                // The title takes the cells up to the first column that totals something; the rest show their totals.
                const cells = row.getVisibleCells();
                const totals = (x: (typeof cells)[number]) => { const f = x.column.columnDef.aggregationFn; return f != null && f !== 'auto'; };
                const at = cells.findIndex(totals);
                const span = at < 0 ? cells.length : Math.max(1, at);
                const gx = rowProps?.(row) ?? {};
                return (
                  <tr {...gx} key={row.id} className={cn('nb-grid-group', gx.className)} data-row-id={row.id}>
                    <td colSpan={span} style={pinStyle(cells[0].column)}>
                      <button type="button" className="nb-grid-group-btn" onClick={row.getToggleExpandedHandler()} aria-expanded={row.getIsExpanded()}>
                        {row.getIsExpanded() ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                        <span>{groupLabel ? groupLabel(row) : <>{String(row.groupingValue ?? '—')} <small>{row.subRows.length}</small></>}</span>
                      </button>
                    </td>
                    {cells.slice(span).map(cell => {
                      const c = cell.column;
                      return (
                        <td key={cell.id} data-align={c.columnDef.meta?.align} data-mono={c.columnDef.meta?.mono ? '' : undefined} style={pinStyle(c)}>
                          {cell.getIsAggregated() && totals(cell) ? flexRender(c.columnDef.aggregatedCell, cell.getContext()) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              }
              const extra = rowProps?.(row) ?? {};
              const selected = row.getIsSelected();
              return (
                <React.Fragment key={row.id}>
                  <tr data-row-id={row.id} aria-selected={selectable ? selected : undefined}
                    data-selected={selected ? '' : undefined} data-active={activeRowId === row.id ? '' : undefined}
                    data-cursor={cursor === row.id ? '' : undefined} data-clickable={onRowClick || selectable || detailOnRowClick ? '' : undefined}
                    {...extra}
                    className={cn('nb-grid-row', extra.className)} style={virtual ? {...extra.style, height: virtualRowHeight} : extra.style}
                    onClick={e => { extra.onClick?.(e); setCursor(row.id); onRowClick?.(row, e); if (detailOnRowClick && renderSubRow && !(e.target as HTMLElement).closest('input,button,a,select,textarea')) toggleDetail(row.id); if (selectable && !onRowClick) selectRow(row, e.shiftKey); }}
                    onDoubleClick={e => { extra.onDoubleClick?.(e); onRowDoubleClick?.(row, e); }}
                    onContextMenu={e => { extra.onContextMenu?.(e); onRowContextMenu?.(row, e); }}>
                    {row.getVisibleCells().map(cell => {
                      const c = cell.column, meta = c.columnDef.meta;
                      return (
                        <td key={cell.id} data-align={meta?.align} data-mono={meta?.mono ? '' : undefined} data-pinned={c.getIsPinned() || undefined}
                          className={meta?.className} style={pinStyle(c)}>
                          {cell.getIsPlaceholder() ? null : flexRender(c.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                  {renderSubRow && openRows[row.id] && (
                    <tr className="nb-grid-subrow"><td colSpan={colSpan}>{renderSubRow(row)}</td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {padBottom > 0 && <tr aria-hidden="true" style={{height: padBottom}}><td colSpan={colSpan}/></tr>}
          </tbody>
          {hasFooter && (
            <tfoot>
              <tr>{leafCols.map(c => (
                <td key={c.id} data-align={c.columnDef.meta?.align} data-mono={c.columnDef.meta?.mono ? '' : undefined} style={pinStyle(c)}>
                  {c.columnDef.footer ? flexRender(c.columnDef.footer, table.getFooterGroups()[0].headers.find(h => h.column.id === c.id)!.getContext()) : null}
                </td>))}
              </tr>
            </tfoot>
          )}
        </table>
        {!loading && !rows.length && (
          <div className="nb-grid-empty">{empty ?? (filtersOn ? 'Nothing matches.' : 'Nothing here yet.')}</div>
        )}
      </div>

      {pageSize && table.getPageCount() > 1 && (
        <div className="nb-grid-pager">
          <span>{pagination.pageIndex * pageSize + 1}–{Math.min(rows.length + pagination.pageIndex * pageSize, table.getPrePaginationRowModel().rows.length)} of {table.getPrePaginationRowModel().rows.length}</span>
          <span className="nb-grid-spacer"/>
          <Tooltip text="Previous page"><button type="button" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Previous page"><ChevronRight size={13} style={{transform: 'rotate(180deg)'}}/></button></Tooltip>
          <span>{pagination.pageIndex + 1} / {table.getPageCount()}</span>
          <Tooltip text="Next page"><button type="button" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Next page"><ChevronRight size={13}/></button></Tooltip>
        </div>
      )}
    </div>
  );
}
