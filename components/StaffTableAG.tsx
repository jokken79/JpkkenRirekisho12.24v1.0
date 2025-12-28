import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  CellContextMenuEvent,
  GridApi,
  RowNode,
  NavigateToNextCellParams,
  CellPosition,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';

// Register AG Grid modules (required for v35+)
ModuleRegistry.registerModules([AllCommunityModule]);
import { motion, AnimatePresence } from 'framer-motion';
import { useStaff, staffService } from '../lib/useSupabase';
import { StaffType, StaffMember, TableField } from '../types';
import { GENZAIX_FIELDS, UKEOI_FIELDS } from '../constants';
import {
  Trash2,
  Edit3,
  MoreHorizontal,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  X,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SearchInput } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';
import { ConfirmDialog } from './ui/confirm-dialog';
import { cn } from '../lib/cn';
import { fadeInUp, staggerContainer } from '../lib/animations';
import AvatarDisplay from './AvatarDisplay';
import { useTheme } from './ThemeProvider';
import type { Staff } from '../lib/database.types';

// Convert camelCase to snake_case for Supabase field access
const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Get value from row using either camelCase or snake_case key
const getRowValue = (row: any, key: string): any => {
  return row[key] ?? row[toSnakeCase(key)] ?? '';
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variant = useMemo(() => {
    const s = status?.toLowerCase() || '';
    if (s.includes('退') || s.includes('終了')) return 'terminated';
    if (s.includes('休') || s.includes('停止')) return 'suspended';
    if (s.includes('pending') || s.includes('待')) return 'pending';
    if (s.includes('active') || s.includes('現在') || s.includes('在籍')) return 'active';
    return 'secondary';
  }, [status]);

  return (
    <Badge variant={variant} dot size="sm">
      {status || '-'}
    </Badge>
  );
}

// Visa alert badge
function VisaAlertBadge({ expiryDate }: { expiryDate?: string }) {
  if (!expiryDate) return <span className="text-slate-400 dark:text-slate-500">-</span>;

  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return (
      <Badge variant="danger" size="sm">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  }
  if (daysUntilExpiry <= 30) {
    return (
      <Badge variant="danger" dot pulse size="sm">
        {daysUntilExpiry}d
      </Badge>
    );
  }
  if (daysUntilExpiry <= 90) {
    return (
      <Badge variant="warning" dot size="sm">
        {daysUntilExpiry}d
      </Badge>
    );
  }
  return <span className="text-slate-600 dark:text-slate-400">{expiryDate}</span>;
}

// Cell Renderers for AG-Grid
const StatusCellRenderer = (props: ICellRendererParams) => {
  return <StatusBadge status={props.value} />;
};

const AvatarCellRenderer = (props: ICellRendererParams) => {
  const name = getRowValue(props.data, 'fullName');
  const photo = getRowValue(props.data, 'photo');
  return <AvatarDisplay name={name} photo={photo} size="sm" />;
};

const VisaCellRenderer = (props: ICellRendererParams) => {
  return <VisaAlertBadge expiryDate={props.value} />;
};

const NumberCellRenderer = (props: ICellRendererParams) => {
  if (props.value == null || props.value === '') return <span className="text-slate-400">-</span>;
  return <span>{Number(props.value).toLocaleString('ja-JP')}</span>;
};

const BooleanCellRenderer = (props: ICellRendererParams) => {
  const val = props.value;
  if (val === true || val === 'true' || val === 1 || val === '1') {
    return <Badge variant="success" size="sm">Yes</Badge>;
  }
  if (val === false || val === 'false' || val === 0 || val === '0') {
    return <Badge variant="secondary" size="sm">No</Badge>;
  }
  return <span className="text-slate-400">-</span>;
};

interface StaffTableAGProps {
  type: StaffType;
  searchTerm?: string;
  onEdit: (member: Staff) => void;
  onAddStaff: () => void;
  onCreateResume: (member: Staff) => void;
}

const StaffTableAG: React.FC<StaffTableAGProps> = ({
  type,
  searchTerm = '',
  onEdit,
  onAddStaff,
  onCreateResume,
}) => {
  const { theme } = useTheme();
  const gridRef = useRef<AgGridReact<Staff>>(null);
  const [gridApi, setGridApi] = useState<GridApi<Staff> | null>(null);

  // Data
  const allStaff = useStaff(type);

  // State
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'terminated' | 'visa-expiring'>('all');
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('staffTable-pageSize');
    return saved ? parseInt(saved, 10) : 20;
  });
  const [selectedRows, setSelectedRows] = useState<Staff[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(searchTerm);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`staffTable-${type}-visibility`);
    return saved ? JSON.parse(saved) : {};
  });

  const fields = type === 'GenzaiX' ? GENZAIX_FIELDS : UKEOI_FIELDS;

  // Sync search term from props
  useEffect(() => {
    setGlobalFilter(searchTerm);
  }, [searchTerm]);

  // Save page size to localStorage
  useEffect(() => {
    localStorage.setItem('staffTable-pageSize', pageSize.toString());
  }, [pageSize]);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(`staffTable-${type}-visibility`, JSON.stringify(columnVisibility));
  }, [columnVisibility, type]);

  // Filter functions
  const isActiveStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s.includes('現在') || s.includes('在籍') || s.includes('active');
  };

  const isTerminatedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s.includes('退') || s.includes('終了') || s.includes('terminated');
  };

  const isVisaExpiringSoon = (visaExpiry: string) => {
    if (!visaExpiry) return false;
    const expiry = new Date(visaExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
  };

  // Filter data based on quick filter and search
  const filteredData = useMemo(() => {
    if (!allStaff) return [];

    let data = allStaff;

    // Apply quick filter
    if (quickFilter !== 'all') {
      data = data.filter((staff) => {
        const status = getRowValue(staff, 'status');
        const visaExpiry = getRowValue(staff, 'visaExpiry');

        switch (quickFilter) {
          case 'active':
            return isActiveStatus(status);
          case 'terminated':
            return isTerminatedStatus(status);
          case 'visa-expiring':
            return isVisaExpiringSoon(visaExpiry);
          default:
            return true;
        }
      });
    }

    // Apply global search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      data = data.filter((staff) => {
        const searchFields = [
          getRowValue(staff, 'fullName'),
          getRowValue(staff, 'empId'),
          getRowValue(staff, 'department'),
          getRowValue(staff, 'dispatchCompany'),
        ];
        return searchFields.some(v => v && String(v).toLowerCase().includes(search));
      });
    }

    return data;
  }, [allStaff, quickFilter, globalFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const data = filteredData;
    const totalCount = data.length;
    const activeCount = data.filter(s => isActiveStatus(getRowValue(s, 'status'))).length;
    const avgWage = data.reduce((sum, s) => sum + (Number(getRowValue(s, 'hourlyWage')) || 0), 0) / (totalCount || 1);
    const visaExpiringCount = data.filter(s => isVisaExpiringSoon(getRowValue(s, 'visaExpiry'))).length;

    return { totalCount, activeCount, avgWage, visaExpiringCount };
  }, [filteredData]);

  // Selected rows stats
  const selectedStats = useMemo(() => {
    if (selectedRows.length === 0) return null;

    const avgWage = selectedRows.reduce((sum, s) => sum + (Number(getRowValue(s, 'hourlyWage')) || 0), 0) / selectedRows.length;
    const totalProfit = selectedRows.reduce((sum, s) => sum + (Number(getRowValue(s, 'profitMargin')) || 0), 0);
    const avgAge = selectedRows.reduce((sum, s) => sum + (Number(getRowValue(s, 'age')) || 0), 0) / selectedRows.length;

    return { avgWage, totalProfit, avgAge };
  }, [selectedRows]);

  // Get cell renderer based on field type
  const getCellRenderer = (field: TableField) => {
    if (field.key === 'status') return StatusCellRenderer;
    if (field.key === 'visaExpiry') return VisaCellRenderer;
    if (field.type === 'number') return NumberCellRenderer;
    if (field.type === 'boolean') return BooleanCellRenderer;
    return undefined;
  };

  // Actions cell renderer
  const ActionsCellRenderer = (props: ICellRendererParams) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="iconSm" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(props.data)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopy(props.data)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400"
            onClick={() => handleDeleteClick(props.data)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Create column definitions
  const columnDefs: ColDef<Staff>[] = useMemo(() => {
    const cols: ColDef<Staff>[] = [
      // Row number column
      {
        headerName: '#',
        valueGetter: (params) => params.node?.rowIndex != null ? params.node.rowIndex + 1 : '',
        width: 50,
        pinned: 'left',
        lockPosition: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: 'text-center text-slate-500 dark:text-slate-400 font-mono text-xs',
      },
      // Photo column
      {
        headerName: '写真',
        field: 'photo' as keyof Staff,
        width: 60,
        pinned: 'left',
        lockPosition: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: AvatarCellRenderer,
      },
      // Status column
      {
        headerName: '現在',
        field: 'status' as keyof Staff,
        valueGetter: (params) => getRowValue(params.data, 'status'),
        width: 96,
        pinned: 'left',
        lockPosition: true,
        cellRenderer: StatusCellRenderer,
      },
      // Employee ID column
      {
        headerName: '社員№',
        field: 'empId' as keyof Staff,
        valueGetter: (params) => getRowValue(params.data, 'empId'),
        width: 96,
        pinned: 'left',
        lockPosition: true,
      },
      // Full Name column
      {
        headerName: '氏名',
        field: 'fullName' as keyof Staff,
        valueGetter: (params) => getRowValue(params.data, 'fullName'),
        width: 150,
        pinned: 'left',
        lockPosition: true,
        cellClass: 'font-medium',
      },
    ];

    // Add dynamic columns from fields (skip ones already added)
    const addedKeys = new Set(['status', 'empId', 'fullName']);
    fields.forEach((field) => {
      if (addedKeys.has(field.key)) return;

      const width = parseInt(field.width?.replace('w-', '') || '48', 10) * 4;
      const isHidden = columnVisibility[field.key] === false;

      cols.push({
        headerName: field.label,
        field: field.key as keyof Staff,
        valueGetter: (params) => getRowValue(params.data, field.key),
        width: Math.max(width, 80),
        hide: isHidden,
        sortable: true,
        filter: true,
        resizable: true,
        cellRenderer: getCellRenderer(field),
      });
    });

    // Actions column
    cols.push({
      headerName: '',
      field: 'actions' as any,
      width: 60,
      pinned: 'right',
      lockPosition: true,
      suppressMovable: true,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsCellRenderer,
    });

    return cols;
  }, [fields, columnVisibility]);

  // Default column definition
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 60,
  }), []);

  // Grid event handlers
  const onGridReady = useCallback((event: GridReadyEvent<Staff>) => {
    setGridApi(event.api);
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<Staff>) => {
    const selected = event.api.getSelectedRows();
    setSelectedRows(selected);
  }, []);

  // Navigate to next cell (arrow key navigation)
  const navigateToNextCell = useCallback((params: NavigateToNextCellParams): CellPosition | null => {
    const { key, nextCellPosition } = params;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return nextCellPosition;
    }

    return null;
  }, []);

  // Actions
  const handleCopy = useCallback((staff: Staff) => {
    const name = getRowValue(staff, 'fullName');
    const empId = getRowValue(staff, 'empId');
    const dept = getRowValue(staff, 'department');
    const text = `${name} (${empId}) - ${dept}`;
    navigator.clipboard.writeText(text);
  }, []);

  const handleDeleteClick = useCallback((staff: Staff) => {
    setDeleteTarget({ id: staff.id, name: getRowValue(staff, 'fullName') });
    setDeleteDialogOpen(true);
    setBulkDeleteMode(false);
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    setDeleteTarget(null);
    setDeleteDialogOpen(true);
    setBulkDeleteMode(true);
  }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      if (bulkDeleteMode) {
        for (const staff of selectedRows) {
          await staffService.delete(staff.id);
        }
        setSelectedRows([]);
        gridApi?.deselectAll();
      } else if (deleteTarget) {
        await staffService.delete(deleteTarget.id);
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    if (!gridApi) return;

    const params = {
      fileName: `${type}_Staff_${new Date().toISOString().split('T')[0]}.csv`,
      onlySelected: selectedRows.length > 0,
    };

    gridApi.exportDataAsCsv(params);
  }, [gridApi, type, selectedRows]);

  const handlePrint = useCallback(() => {
    const data = selectedRows.length > 0 ? selectedRows : filteredData;
    const printFields = fields.slice(0, 10);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Staff List - ${type}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Staff List - ${type}</h1>
          <p>Generated: ${new Date().toLocaleString('ja-JP')}</p>
          <table>
            <thead>
              <tr>
                ${printFields.map(f => `<th>${f.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(staff => `
                <tr>
                  ${printFields.map(f => `<td>${getRowValue(staff, f.key) || '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [selectedRows, filteredData, fields, type]);

  const handleClearSelection = useCallback(() => {
    gridApi?.deselectAll();
    setSelectedRows([]);
  }, [gridApi]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));

    // Update AG-Grid column visibility
    if (gridApi) {
      const col = gridApi.getColumn(columnKey);
      if (col) {
        gridApi.setColumnsVisible([columnKey], !columnVisibility[columnKey]);
      }
    }
  }, [gridApi, columnVisibility]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        gridApi?.selectAll();
      }
      if (e.key === 'Escape') {
        if (selectedRows.length > 0) {
          handleClearSelection();
        } else if (globalFilter) {
          setGlobalFilter('');
        }
      }
      if ((e.key === 'Delete' || (e.ctrlKey && e.key === 'Backspace')) && selectedRows.length > 0) {
        e.preventDefault();
        handleBulkDeleteClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gridApi, selectedRows, globalFilter, handleClearSelection, handleBulkDeleteClick]);

  // Loading state
  if (!allStaff) {
    return (
      <motion.div {...fadeInUp} className="space-y-4 p-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <motion.div {...fadeInUp} className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4">
        {/* Search and Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search staff..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            onClear={() => setGlobalFilter('')}
            className="w-64"
          />

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'terminated', 'visa-expiring'] as const).map((filter) => (
              <Button
                key={filter}
                variant={quickFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(filter)}
              >
                {filter === 'all' && 'All'}
                {filter === 'active' && 'Active'}
                {filter === 'terminated' && 'Terminated'}
                {filter === 'visa-expiring' && (
                  <>
                    Visa Alert
                    {stats.visaExpiringCount > 0 && (
                      <Badge variant="danger" size="sm" className="ml-1">
                        {stats.visaExpiringCount}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Stats Badges */}
          <div className="hidden lg:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {stats.totalCount}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {Math.round(stats.avgWage).toLocaleString()}
            </span>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {fields.slice(3).map((field) => (
                <DropdownMenuCheckboxItem
                  key={field.key}
                  checked={columnVisibility[field.key] !== false}
                  onCheckedChange={() => toggleColumnVisibility(field.key)}
                >
                  {field.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page Size */}
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              const size = parseInt(val, 10);
              setPageSize(size);
              gridApi?.paginationSetPageSize(size);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100, 200].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Toolbar */}
        <AnimatePresence>
          {selectedRows.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 py-2 px-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
            >
              <Badge variant="default" className="font-medium">
                {selectedRows.length} selected
              </Badge>

              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>

              <div className="flex-1" />

              {selectedStats && (
                <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>Avg Wage: {Math.round(selectedStats.avgWage).toLocaleString()}</span>
                  <span>Total Profit: {Math.round(selectedStats.totalProfit).toLocaleString()}</span>
                </div>
              )}

              <Button variant="ghost" size="iconSm" onClick={handleClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AG-Grid */}
      <div className={cn(
        'flex-1 w-full',
        theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
      )}>
        <AgGridReact<Staff>
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}

          // Selection
          rowSelection="multiple"
          suppressRowClickSelection={false}
          rowMultiSelectWithClick={true}

          // Pagination
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[10, 20, 50, 100, 200]}

          // Performance
          rowBuffer={10}
          animateRows={true}

          // Navigation
          navigateToNextCell={navigateToNextCell}

          // Events
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}

          // Styling
          getRowId={(params) => params.data.id}
          rowHeight={44}
          headerHeight={44}

          // Suppress features
          suppressCellFocus={false}

          // Theme - use legacy to work with v32 CSS files
          theme="legacy"
        />
      </div>

      {/* Stats Footer */}
      <motion.div
        {...fadeInUp}
        className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Total: {stats.totalCount}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              Active: {stats.activeCount}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Avg: {Math.round(stats.avgWage).toLocaleString()}
            </span>
            {stats.visaExpiringCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Calendar className="h-4 w-4" />
                Visa Alert: {stats.visaExpiringCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={bulkDeleteMode ? `Delete ${selectedRows.length} employees?` : 'Delete employee?'}
        description={
          bulkDeleteMode
            ? `This will permanently delete ${selectedRows.length} selected employees. This action cannot be undone.`
            : `This will permanently delete ${deleteTarget?.name}. This action cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default StaffTableAG;
