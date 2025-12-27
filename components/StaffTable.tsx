import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
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
  Search,
  X,
  Filter,
  AlertTriangle,
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

interface Props {
  type: StaffType;
  searchTerm: string;
  onEdit: (member: StaffMember) => void;
}

const StaffTable: React.FC<Props> = ({ type, searchTerm, onEdit }) => {
  const allStaff = useStaff(type);
  const fields = type === 'GenzaiX' ? GENZAIX_FIELDS : UKEOI_FIELDS;

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Build columns from field definitions
  const columns = useMemo<ColumnDef<Staff>[]>(() => {
    const cols: ColumnDef<Staff>[] = [];

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
        const empId = getRowValue(row.original, 'empId') || getRowValue(row.original, 'emp_id');
        const fullName = getRowValue(row.original, 'fullName') || getRowValue(row.original, 'full_name');
        // Only use photo field if it exists - don't fallback to empId.jpg
        const photoFile = photo || '';
        return (
          <AvatarDisplay
            filename={photoFile}
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
        cell: ({ getValue, row }) => {
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
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await staffService.delete(deleteTarget.id);
    } catch (error) {
      console.error('Failed to delete staff:', error);
      // Error will be shown via toast or handled by caller
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // Create table instance
  const table = useReactTable({
    data: allStaff || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn,
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
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-slate-200">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <SearchInput
            placeholder="Search employees..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            onClear={() => setGlobalFilter('')}
            className="w-full"
          />
        </div>

        {/* Filters and Settings */}
        <div className="flex items-center gap-2">
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
              {[5, 10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <motion.div
          variants={fadeInUp}
          className="min-w-max bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    const isFrozen = idx <= 3; // Freeze first 4 columns (#, photo, status, empId)
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200',
                          isFrozen && 'sticky bg-slate-50 z-20',
                          idx === 0 && 'left-0',
                          idx === 1 && 'left-[50px]',
                          idx === 2 && 'left-[110px]',
                          idx === 3 && 'left-[206px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]'
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
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/30 group transition-colors"
                  >
                    {row.getVisibleCells().map((cell, idx) => {
                      const isFrozen = idx <= 3; // Freeze first 4 columns (#, photo, status, empId)
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-4 py-4 text-sm text-slate-600 border-r border-slate-100',
                            isFrozen && 'sticky bg-white group-hover:bg-blue-50/30 z-10',
                            idx === 0 && 'left-0',
                            idx === 1 && 'left-[50px]',
                            idx === 2 && 'left-[110px]',
                            idx === 3 && 'left-[206px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]'
                          )}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
        <div className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-medium text-slate-900">
            {table.getState().pagination.pageIndex * pageSize + 1}
          </span>
          {' - '}
          <span className="font-medium text-slate-900">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>
          {' of '}
          <span className="font-medium text-slate-900">
            {table.getFilteredRowModel().rows.length}
          </span>
          {' results'}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-4 text-sm text-slate-700">
            Page{' '}
            <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span>
            {' of '}
            <span className="font-medium">{table.getPageCount()}</span>
          </span>

          <Button
            variant="outline"
            size="iconSm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Employee Record"
        description={`Are you sure you want to permanently delete ${deleteTarget?.name || 'this employee'}? This action cannot be undone.`}
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
