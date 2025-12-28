import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  FilterFn,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaff, staffService } from '../lib/useSupabase';
import { StaffType, StaffMember, TableField } from '../types';
import { GENZAIX_FIELDS, UKEOI_FIELDS } from '../constants';
import {
  Trash2,
  Edit3,
  MoreHorizontal,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  X,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  Eye,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SearchInput } from './ui/input';
import { Checkbox } from './ui/checkbox';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './ui/context-menu';
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
import type { Staff } from '../lib/database.types';

// Convert camelCase to snake_case for Supabase field access
const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Get value from row using either camelCase or snake_case key
const getRowValue = (row: any, key: string): any => {
  return row[key] ?? row[toSnakeCase(key)] ?? '';
};

// Global filter function
const globalFilterFn: FilterFn<Staff> = (row, columnId, filterValue) => {
  const search = filterValue.toLowerCase();
  const values = [
    row.original.full_name,
    row.original.fullName,
    row.original.emp_id,
    row.original.empId,
    row.original.department,
    row.original.dispatch_company,
    row.original.dispatchCompany,
  ];
  return values.some(v => v && String(v).toLowerCase().includes(search));
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
  if (!expiryDate) return <span className="text-slate-400">-</span>;

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

  return <span className="text-slate-600">{expiryDate}</span>;
}

// Quick filter type
type QuickFilter = 'all' | 'active' | 'terminated' | 'visa-expiring';

interface Props {
  type: StaffType;
  searchTerm: string;
  onEdit: (member: StaffMember) => void;
}

const StaffTable: React.FC<Props> = ({ type, searchTerm, onEdit }) => {
  const allStaff = useStaff(type);
  const fields = type === 'GenzaiX' ? GENZAIX_FIELDS : UKEOI_FIELDS;
  const tableRef = useRef<HTMLTableElement>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  // Sync external search term
  useEffect(() => {
    setGlobalFilter(searchTerm);
  }, [searchTerm]);

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`staffTable-${type}-visibility`);
    if (saved) {
      try {
        setColumnVisibility(JSON.parse(saved));
      } catch {}
    }
    const savedPageSize = localStorage.getItem('staffTable-pageSize');
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10) || 20);
    }
  }, [type]);

  // Save visibility preferences
  useEffect(() => {
    if (Object.keys(columnVisibility).length > 0) {
      localStorage.setItem(`staffTable-${type}-visibility`, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, type]);

  // Save page size preference
  useEffect(() => {
    localStorage.setItem('staffTable-pageSize', String(pageSize));
  }, [pageSize]);

  // Apply quick filter
  const filteredData = useMemo(() => {
    if (!allStaff) return [];

    return allStaff.filter(staff => {
      if (quickFilter === 'all') return true;

      const status = (staff.status || '').toLowerCase();
      const visaExpiry = staff.visa_expiry || staff.visaExpiry;

      switch (quickFilter) {
        case 'active':
          return status.includes('現在') || status.includes('在籍') || status.includes('active');
        case 'terminated':
          return status.includes('退') || status.includes('終了') || status.includes('terminated');
        case 'visa-expiring': {
          if (!visaExpiry) return false;
          const expiry = new Date(visaExpiry);
          const now = new Date();
          const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return days <= 90 && days >= 0;
        }
        default:
          return true;
      }
    });
  }, [allStaff, quickFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredData) return { total: 0, active: 0, avgWage: 0, visaExpiring: 0 };

    const active = filteredData.filter(s => {
      const status = (s.status || '').toLowerCase();
      return status.includes('現在') || status.includes('在籍') || status.includes('active');
    }).length;

    const wages = filteredData.map(s => s.hourly_wage || s.hourlyWage || 0).filter(w => w > 0);
    const avgWage = wages.length > 0 ? Math.round(wages.reduce((a, b) => a + b, 0) / wages.length) : 0;

    const visaExpiring = filteredData.filter(s => {
      const visaExpiry = s.visa_expiry || s.visaExpiry;
      if (!visaExpiry) return false;
      const expiry = new Date(visaExpiry);
      const now = new Date();
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 90 && days >= 0;
    }).length;

    return { total: filteredData.length, active, avgWage, visaExpiring };
  }, [filteredData]);

  // Calculate selected rows stats
  const selectedStats = useMemo(() => {
    const selectedRows = Object.keys(rowSelection).map(id => filteredData.find(s => String(s.id) === id)).filter(Boolean) as Staff[];
    if (selectedRows.length === 0) return null;

    const wages = selectedRows.map(s => s.hourly_wage || s.hourlyWage || 0).filter(w => w > 0);
    const avgWage = wages.length > 0 ? Math.round(wages.reduce((a, b) => a + b, 0) / wages.length) : 0;

    const profits = selectedRows.map(s => s.profit_margin || s.profitMargin || 0).filter(p => p > 0);
    const totalProfit = profits.reduce((a, b) => a + b, 0);

    const ages = selectedRows.map(s => s.age || 0).filter(a => a > 0);
    const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '0';

    return { count: selectedRows.length, avgWage, totalProfit, avgAge };
  }, [rowSelection, filteredData]);

  // Build columns from field definitions
  const columns = useMemo<ColumnDef<Staff>[]>(() => {
    const cols: ColumnDef<Staff>[] = [];

    // Selection checkbox column
    cols.push({
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      size: 48,
      enableSorting: false,
      enableHiding: false,
    });

    // Row number column
    cols.push({
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="text-slate-400 font-mono text-xs">
          {row.index + 1}
        </span>
      ),
      size: 50,
      enableSorting: false,
      enableHiding: false,
    });

    // Avatar/Photo column
    cols.push({
      id: 'photo',
      header: '写真',
      cell: ({ row }) => {
        const photo = getRowValue(row.original, 'photo');
        const fullName = getRowValue(row.original, 'fullName') || getRowValue(row.original, 'full_name');
        return (
          <AvatarDisplay
            filename={photo || ''}
            alt={fullName || 'Employee'}
            size="sm"
          />
        );
      },
      size: 60,
      enableSorting: false,
      enableHiding: true,
    });

    // Data columns from fields
    fields.forEach((field) => {
      cols.push({
        id: field.key,
        accessorFn: (row) => getRowValue(row, field.key),
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {field.label}
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const value = getValue();

          // Special rendering for status
          if (field.key === 'status') {
            return <StatusBadge status={String(value)} />;
          }

          // Special rendering for visa expiry
          if (field.key === 'visaExpiry') {
            return <VisaAlertBadge expiryDate={String(value)} />;
          }

          // Boolean fields
          if (field.type === 'boolean') {
            return value ? (
              <Badge variant="success" size="sm">Yes</Badge>
            ) : (
              <Badge variant="secondary" size="sm">No</Badge>
            );
          }

          // Number fields
          if (field.type === 'number' && value) {
            return (
              <span className="font-mono">
                {Number(value).toLocaleString()}
              </span>
            );
          }

          return (
            <span className="truncate max-w-[200px] block">
              {value ? String(value) : '-'}
            </span>
          );
        },
        size: parseInt(field.width?.replace('w-', '') || '150', 10) * 4,
        meta: { field },
      });
    });

    // Actions column
    cols.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEdit(row.original as StaffMember)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(row.original as StaffMember)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyRow(row.original)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const name = getRowValue(row.original, 'fullName') || getRowValue(row.original, 'full_name') || 'this employee';
                  openDeleteDialog(row.original.id!, name);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: 100,
      enableSorting: false,
      enableHiding: false,
    });

    return cols;
  }, [fields, onEdit]);

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setBulkDeleteMode(false);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (bulkDeleteMode) {
      // Bulk delete
      setDeleteLoading(true);
      try {
        const selectedIds = Object.keys(rowSelection);
        await Promise.all(selectedIds.map(id => staffService.delete(id)));
        setRowSelection({});
      } catch (error) {
        console.error('Failed to bulk delete staff:', error);
      } finally {
        setDeleteLoading(false);
        setDeleteDialogOpen(false);
        setBulkDeleteMode(false);
      }
    } else if (deleteTarget) {
      // Single delete
      setDeleteLoading(true);
      try {
        await staffService.delete(deleteTarget.id);
      } catch (error) {
        console.error('Failed to delete staff:', error);
      } finally {
        setDeleteLoading(false);
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    }
  };

  const handleBulkDelete = () => {
    const count = Object.keys(rowSelection).length;
    setDeleteTarget({ id: '', name: `${count} employees` });
    setBulkDeleteMode(true);
    setDeleteDialogOpen(true);
  };

  const handleCopyRow = async (row: Staff) => {
    const name = getRowValue(row, 'fullName') || getRowValue(row, 'full_name');
    const empId = getRowValue(row, 'empId') || getRowValue(row, 'emp_id');
    const department = row.department || '';
    const text = `${name} (${empId}) - ${department}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Export functions
  const handleExportCSV = async (selectedOnly: boolean = false) => {
    const dataToExport = selectedOnly
      ? Object.keys(rowSelection).map(id => filteredData.find(s => String(s.id) === id)).filter(Boolean)
      : filteredData;

    if (!dataToExport.length) return;

    const headers = fields.map(f => f.label);
    const rows = dataToExport.map(row =>
      fields.map(f => {
        const value = getRowValue(row, f.key);
        return value ? String(value) : '';
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_Staff_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (selectedOnly: boolean = false) => {
    const dataToExport = selectedOnly
      ? Object.keys(rowSelection).map(id => filteredData.find(s => String(s.id) === id)).filter(Boolean)
      : filteredData;

    if (!dataToExport.length) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type} Staff List</title>
        <style>
          body { font-family: sans-serif; font-size: 10px; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          h1 { font-size: 16px; margin-bottom: 10px; }
          .meta { color: #666; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <h1>${type === 'GenzaiX' ? '派遣社員' : '請負社員'} List</h1>
        <div class="meta">Exported: ${new Date().toLocaleString('ja-JP')}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              ${fields.slice(0, 10).map(f => `<th>${f.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map((row, i) => `
              <tr>
                <td>${i + 1}</td>
                ${fields.slice(0, 10).map(f => `<td>${getRowValue(row, f.key) || '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + A - Select all
      if (modKey && e.key === 'a' && document.activeElement?.closest('table')) {
        e.preventDefault();
        table.toggleAllRowsSelected(true);
      }

      // Escape - Clear selection
      if (e.key === 'Escape') {
        if (Object.keys(rowSelection).length > 0) {
          setRowSelection({});
        } else if (globalFilter) {
          setGlobalFilter('');
        }
      }

      // Delete/Backspace with selection
      if ((e.key === 'Delete' || (modKey && e.key === 'Backspace')) && Object.keys(rowSelection).length > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rowSelection, globalFilter]);

  // Create table instance
  const table = useReactTable({
    data: filteredData || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Update page size when changed
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const selectedCount = Object.keys(rowSelection).length;

  // Loading state
  if (!allStaff) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex-1 flex flex-col overflow-hidden bg-slate-100"
    >
      {/* Enhanced Toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        {/* Primary toolbar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          {/* Left: Search + Quick Filters */}
          <div className="flex items-center gap-3 flex-1">
            <SearchInput
              placeholder="Search employees..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              onClear={() => setGlobalFilter('')}
              className="w-80"
            />

            {/* Quick filter buttons */}
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant={quickFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('all')}
              >
                All
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                  {allStaff?.length || 0}
                </span>
              </Button>
              <Button
                variant={quickFilter === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('active')}
                className="gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active
              </Button>
              <Button
                variant={quickFilter === 'terminated' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('terminated')}
                className="gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Terminated
              </Button>
              <Button
                variant={quickFilter === 'visa-expiring' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('visa-expiring')}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Visa Alert
                {stats.visaExpiring > 0 && (
                  <Badge variant="danger" size="sm">{stats.visaExpiring}</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Right: Export + Column Settings */}
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportCSV(false)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download CSV (All)
                </DropdownMenuItem>
                {selectedCount > 0 && (
                  <DropdownMenuItem onClick={() => handleExportCSV(true)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV ({selectedCount} selected)
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePrint(false)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print All
                </DropdownMenuItem>
                {selectedCount > 0 && (
                  <DropdownMenuItem onClick={() => handlePrint(true)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Selected ({selectedCount})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-auto">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {(column.columnDef.meta as any)?.field?.label || column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Page Size */}
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100, 200].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Toolbar */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-4 px-6 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{selectedCount}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-900">selected</span>
                </div>

                <div className="w-px h-6 bg-blue-200" />

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(true)}
                    className="bg-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(true)}
                    className="bg-white"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>

                <button
                  onClick={() => setRowSelection({})}
                  className="ml-auto p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <motion.div
          variants={fadeInUp}
          className="min-w-max bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <table ref={tableRef} className="w-full border-collapse" tabIndex={0}>
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    const isFrozen = idx <= 4; // Freeze first 5 columns (select, #, photo, status, empId)
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200',
                          isFrozen && 'sticky bg-slate-50 z-20',
                          idx === 0 && 'left-0',
                          idx === 1 && 'left-[48px]',
                          idx === 2 && 'left-[98px]',
                          idx === 3 && 'left-[158px]',
                          idx === 4 && 'left-[254px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]'
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-24 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Database size={48} className="opacity-10" />
                      <p className="font-medium text-slate-400">
                        No records found matching your criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <tr
                        className={cn(
                          'group transition-all duration-150 cursor-pointer',
                          row.getIsSelected()
                            ? 'bg-blue-50/80 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600'
                            : rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                          !row.getIsSelected() && 'hover:bg-blue-50/30'
                        )}
                        onClick={() => row.toggleSelected()}
                      >
                        {row.getVisibleCells().map((cell, idx) => {
                          const isFrozen = idx <= 4;
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                'px-4 py-4 text-sm text-slate-600 border-r border-slate-100',
                                isFrozen && 'sticky z-10',
                                isFrozen && (row.getIsSelected()
                                  ? 'bg-blue-50/80'
                                  : rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'),
                                isFrozen && !row.getIsSelected() && 'group-hover:bg-blue-50/30',
                                idx === 0 && 'left-0',
                                idx === 1 && 'left-[48px]',
                                idx === 2 && 'left-[98px]',
                                idx === 3 && 'left-[158px]',
                                idx === 4 && 'left-[254px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]'
                              )}
                              style={{ width: cell.column.getSize() }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onEdit(row.original as StaffMember)}>
                        <Edit3 className="h-4 w-4 mr-3 text-slate-400" />
                        Edit Details
                        <ContextMenuShortcut>E</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleCopyRow(row.original)}>
                        <Copy className="h-4 w-4 mr-3 text-slate-400" />
                        Copy Data
                        <ContextMenuShortcut>C</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleExportCSV(true)}>
                        <Download className="h-4 w-4 mr-3 text-slate-400" />
                        Export Selected
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handlePrint(true)}>
                        <Printer className="h-4 w-4 mr-3 text-slate-400" />
                        Print Selected
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => {
                          const name = getRowValue(row.original, 'fullName') || getRowValue(row.original, 'full_name') || 'this employee';
                          openDeleteDialog(row.original.id!, name);
                        }}
                        danger
                      >
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Employee
                        <ContextMenuShortcut>Del</ContextMenuShortcut>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="sticky bottom-0 z-20 bg-slate-50 border-t border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Total:</span>
                <span className="font-semibold text-slate-900">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Active:</span>
                <span className="font-semibold text-emerald-600">{stats.active}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Avg Wage:</span>
                <span className="font-mono font-semibold text-slate-900">¥{stats.avgWage.toLocaleString()}</span>
              </div>
            </div>

            {/* Selected stats */}
            {selectedStats && (
              <>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedStats.count} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Avg Wage:</span>
                    <span className="text-sm font-mono font-semibold text-slate-900">
                      ¥{selectedStats.avgWage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-slate-500">Total Profit:</span>
                    <span className="text-sm font-mono font-semibold text-emerald-600">
                      ¥{selectedStats.totalProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">Avg Age:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedStats.avgAge}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Pagination */}
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Updated just now
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 text-sm text-slate-700 min-w-[100px] text-center">
                Page{' '}
                <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span>
                {' of '}
                <span className="font-medium">{table.getPageCount()}</span>
              </span>

              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={bulkDeleteMode ? 'Delete Multiple Employees' : 'Delete Employee Record'}
        description={bulkDeleteMode
          ? `Are you sure you want to permanently delete ${deleteTarget?.name}? This action cannot be undone.`
          : `Are you sure you want to permanently delete ${deleteTarget?.name || 'this employee'}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </motion.div>
  );
};

export default StaffTable;
