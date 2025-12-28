# Elite UI Integration Guide
## StaffHub UNS Pro - Premium Component Implementation

This guide shows how to integrate all the new elite UI components into your existing StaffHub application.

---

## 1. SKELETON LOADING INTEGRATION

### Replace Loading State in StaffTable.tsx

**Location**: `C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\components\StaffTable.tsx`

**Find** (around line 676):
```tsx
if (!allStaff) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        // ... more basic skeletons
      </div>
    </div>
  );
}
```

**Replace with**:
```tsx
import { TableSkeleton } from './ui/table-skeleton';

if (!allStaff) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-shimmer" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-shimmer" />
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-shimmer" />
        </div>
      </div>
      <TableSkeleton rows={15} />
    </div>
  );
}
```

### Update Dashboard.tsx Loading

**Location**: `C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\components\Dashboard.tsx`

**Add imports**:
```tsx
import { StatCardSkeleton, ChartSkeleton } from './ui/card-skeleton';
import { KpiCard, ProgressRing, DonutChart, ComparisonBar } from './ui/mini-charts';
```

**Add loading state**:
```tsx
const Dashboard: React.FC<Props> = ({ onNav }) => {
  const genzaixCount = useStaffCount('GenzaiX');
  const ukeoiCount = useStaffCount('Ukeoi');
  const activeStaff = useActiveStaffCount();
  const resumeCount = useResumeCount();

  // Add loading check
  const isLoading = genzaixCount === undefined || ukeoiCount === undefined;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  // ... rest of component
}
```

---

## 2. COMMAND PALETTE INTEGRATION

### Add to App.tsx

**Location**: `C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\App.tsx`

**Add imports** (top of file):
```tsx
import { CommandPalette, createDefaultCommands } from './components/ui/command-palette';
```

**Add to App component** (before return statement):
```tsx
const App: React.FC = () => {
  // ... existing state

  // Command palette commands
  const commands = useMemo(() => createDefaultCommands(
    setActiveView,
    {
      addStaff: handleAddStaff,
      addResume: handleAddResume,
      exportData: () => {
        // Export logic here
        console.log('Exporting data...');
      }
    }
  ), []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Add Command Palette */}
      <CommandPalette commands={commands} />

      {/* Rest of your app */}
      {/* ... existing sidebar, main content */}
    </div>
  );
};
```

---

## 3. FLOATING ACTION BUTTON (FAB)

### Add to Main Content Area

**In App.tsx**, add before closing `</main>` tag:

```tsx
import { StaffHubFab } from './components/ui/fab';

// Inside return statement, before </main>:
<main className="flex-1 flex flex-col overflow-hidden">
  {/* Existing header and content */}

  {/* Add FAB - only show on staff/resume views */}
  {['genzaix', 'ukeoi', 'resumes'].includes(activeView) && (
    <StaffHubFab
      onAddStaff={handleAddStaff}
      onAddResume={handleAddResume}
      onExport={() => {
        // Export current view data
        console.log('Export from FAB');
      }}
    />
  )}
</main>
```

---

## 4. ENHANCED EMPTY STATES

### Update StaffTable.tsx

**Find** the empty state rendering (around line 938):
```tsx
{table.getRowModel().rows.length === 0 ? (
  <tr>
    <td colSpan={columns.length} className="py-24 text-center text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <Database size={48} className="opacity-10" />
        <p className="font-medium text-slate-400">
          No records found matching your criteria
        </p>
      </div>
    </td>
  </tr>
) : (
```

**Replace with**:
```tsx
import { EmptyState } from './ui/empty-state';
import { Database, Users } from 'lucide-react';

{table.getRowModel().rows.length === 0 ? (
  <tr>
    <td colSpan={columns.length} className="py-0">
      {globalFilter || quickFilter !== 'all' ? (
        <EmptyState
          icon={Database}
          title="No results found"
          description="We couldn't find any staff members matching your search criteria. Try adjusting your filters or search terms."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setGlobalFilter('');
              setQuickFilter('all');
            }
          }}
        />
      ) : (
        <EmptyState
          icon={Users}
          title={`No ${type} staff yet`}
          description="Get started by adding your first staff member. All employee data is stored locally and securely."
          action={{
            label: 'Add Staff Member',
            onClick: () => onEdit(undefined as any)
          }}
        />
      )}
    </td>
  </tr>
) : (
```

---

## 5. ENHANCED DASHBOARD WITH MINI CHARTS

### Add KPI Cards with Sparklines

**In Dashboard.tsx**, replace the stats grid:

```tsx
import { KpiCard, Sparkline, DonutChart, ComparisonBar, ProgressRing } from './ui/mini-charts';
import { Users, Briefcase, TrendingUp, DollarSign } from 'lucide-react';

// Add mock historical data (replace with real data)
const genzaixTrend = [45, 48, 52, 55, 62, 68, 75];
const ukeoiTrend = [32, 35, 38, 42, 45, 50, 55];
const revenueTrend = [120, 135, 142, 155, 168, 180, 195];

// Replace stats grid section:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <KpiCard
    label="GenzaiX Staff"
    value={genzaixCount || 0}
    change="+4.2%"
    trend="up"
    sparklineData={genzaixTrend}
    icon={<Users className="w-5 h-5" />}
  />

  <KpiCard
    label="Ukeoi Contractors"
    value={ukeoiCount || 0}
    change="+12.5%"
    trend="up"
    sparklineData={ukeoiTrend}
    icon={<Briefcase className="w-5 h-5" />}
  />

  <KpiCard
    label="Revenue Growth"
    value="¥12.5M"
    change="+8.3%"
    trend="up"
    sparklineData={revenueTrend}
    icon={<TrendingUp className="w-5 h-5" />}
  />

  <KpiCard
    label="Active CVs"
    value={resumeCount || 0}
    change="+5.1%"
    trend="up"
    icon={<FileText className="w-5 h-5" />}
  />
</div>

{/* Add new visualization row */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Status Distribution Donut */}
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-6">
      Staff Status
    </h3>
    <div className="flex items-center justify-center">
      <DonutChart
        segments={[
          { value: activeStaff || 0, color: '#10B981', label: 'Active' },
          { value: ((genzaixCount || 0) - (activeStaff || 0)), color: '#E2E8F0', label: 'Inactive' }
        ]}
        centerLabel="Active"
        centerValue={activeStaff || 0}
        size={140}
      />
    </div>
    <div className="mt-6 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Active</span>
        </div>
        <span className="font-bold text-slate-900">{activeStaff || 0}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <span className="text-slate-600">Inactive</span>
        </div>
        <span className="font-bold text-slate-900">
          {((genzaixCount || 0) - (activeStaff || 0))}
        </span>
      </div>
    </div>
  </div>

  {/* GenzaiX vs Ukeoi Comparison */}
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-6">
      Workforce Split
    </h3>
    <ComparisonBar
      label1="GenzaiX"
      value1={genzaixCount || 0}
      label2="Ukeoi"
      value2={ukeoiCount || 0}
      color1="#3B82F6"
      color2="#E2E8F0"
      height={40}
    />
  </div>

  {/* Capacity Progress Ring */}
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-6">
      Capacity
    </h3>
    <div className="flex flex-col items-center">
      <ProgressRing
        progress={((genzaixCount || 0) / 400) * 100}
        size="lg"
        color="blue"
        label="of 400"
      />
      <p className="mt-4 text-sm text-slate-500 text-center">
        Current staffing at{' '}
        <span className="font-bold text-slate-900">
          {Math.round(((genzaixCount || 0) / 400) * 100)}%
        </span>{' '}
        capacity
      </p>
    </div>
  </div>
</div>
```

---

## 6. ADD SHIMMER ANIMATION CSS

### Update index.html or global CSS

Add this to your `<style>` tag in `index.html` or your main CSS file:

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 20%,
    #f1f5f9 40%,
    #f1f5f9 100%
  );
  background-size: 1000px 100%;
}

/* Enhanced hover glow effect */
.hover-glow {
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

/* Smooth focus rings */
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  border-radius: 8px;
}
```

---

## 7. ENHANCED BUTTON MICRO-INTERACTIONS

### Update Button Component

**Location**: `C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\components\ui\button.tsx`

**Wrap the existing button** with motion and add ripple effect:

```tsx
import { motion } from 'framer-motion';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative overflow-hidden",
          // Add shimmer on hover
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
          "before:translate-x-[-200%] hover:before:translate-x-[200%]",
          "before:transition-transform before:duration-700"
        )}
        {...props}
      />
    );
  }
);
```

---

## 8. KEYBOARD SHORTCUTS GUIDE

Add a keyboard shortcuts modal that shows on `?` press:

```tsx
// Add to App.tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      // Show shortcuts modal
      alert('Keyboard Shortcuts:\nCmd/Ctrl+K - Command Palette\nG D - Dashboard\nG G - GenzaiX\nG U - Ukeoi\nN S - New Staff');
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## QUICK START CHECKLIST

- [ ] Copy all new component files to `components/ui/`
- [ ] Add shimmer animation CSS to `index.html`
- [ ] Install framer-motion if not present: `npm install framer-motion`
- [ ] Update StaffTable.tsx with TableSkeleton
- [ ] Update Dashboard.tsx with KPI cards and mini charts
- [ ] Add CommandPalette to App.tsx
- [ ] Add FAB to main content area
- [ ] Replace empty states with EmptyState component
- [ ] Update Button component with motion
- [ ] Test all interactions and animations
- [ ] Adjust colors to match your #0052CC and #DC143C brand

---

## PERFORMANCE NOTES

All animations use:
- **GPU-accelerated transforms** (translateX, scale, rotate)
- **Framer Motion** for optimized React animations
- **Stagger effects** for sequential reveals (0.03s delay per item)
- **Spring physics** for natural motion (stiffness: 300, damping: 25)
- **Will-change hints** on animated elements

Expected performance: 60fps on modern browsers, graceful degradation on older devices.

---

## COLOR SYSTEM REFERENCE

```tsx
// Your corporate palette
const colors = {
  primary: '#0052CC',    // Blue
  accent: '#DC143C',     // Red
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};
```

Use these consistently across all new components for brand cohesion.
