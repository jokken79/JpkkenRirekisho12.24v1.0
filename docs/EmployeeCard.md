# EmployeeCard Component

A versatile React component for displaying employee information in StaffHub UNS Pro. Supports multiple display variants and automatic visa status calculation.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Props](#props)
- [Variants](#variants)
- [Features](#features)
- [Examples](#examples)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Related Components](#related-components)

---

## Installation

The component is included in the StaffHub UNS Pro project. No additional installation required.

```tsx
import EmployeeCard from './components/EmployeeCard';
```

### Dependencies

- `react` >= 19.x
- `lucide-react` - For icons
- `../types` - StaffMember type definition
- `./AvatarDisplay` - Avatar component

---

## Quick Start

```tsx
import EmployeeCard from './components/EmployeeCard';
import { StaffMember } from './types';

const employee: StaffMember = {
  id: 1,
  type: 'GenzaiX',
  status: '現在',
  empId: 'EMP001',
  fullName: 'グエン ヴァン A',
  nationality: 'ベトナム',
  hireDate: '2022-04-01',
  visaExpiry: '2026-03-31',
};

function App() {
  return <EmployeeCard employee={employee} />;
}
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `employee` | `StaffMember` | **required** | Employee data object |
| `variant` | `'compact' \| 'default' \| 'detailed'` | `'default'` | Display variant |
| `onClick` | `(employee: StaffMember) => void` | `undefined` | Click handler |
| `showFinancials` | `boolean` | `false` | Show wage/billing info |
| `className` | `string` | `''` | Additional CSS classes |

### TypeScript Interface

```typescript
interface EmployeeCardProps {
  employee: StaffMember;
  variant?: 'compact' | 'default' | 'detailed';
  onClick?: (employee: StaffMember) => void;
  showFinancials?: boolean;
  className?: string;
}
```

---

## Variants

### Compact Variant

Minimal display for lists and sidebars. Shows avatar, name, company, and type badge.

```tsx
<EmployeeCard employee={employee} variant="compact" />
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Avatar] Name                    [派遣] │
│          Company/Department             │
└─────────────────────────────────────────┘
```

**Use cases:**
- Sidebar employee lists
- Search results
- Dropdown selections
- Mobile views

---

### Default Variant

Standard card with key employee information. Shows avatar, status, work info, and visa status.

```tsx
<EmployeeCard employee={employee} />
// or
<EmployeeCard employee={employee} variant="default" />
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ [Avatar]  Name                [Status]  [Type] │
│           Furigana • #EmpId                     │
│           ┌─────────────┬─────────────┐        │
│           │ 🏢 Company  │ 📍 Country  │        │
│           │ 📅 HireDate │ ✓ Visa: OK  │        │
│           └─────────────┴─────────────┘        │
│ ─────────────────────────────────────────────── │
│ 💳 時給: ¥1,200  請求: ¥1,800  +¥600          │
└─────────────────────────────────────────────────┘
```

**Use cases:**
- Dashboard grids
- Employee listings
- Quick overview cards

---

### Detailed Variant

Full information display with organized sections.

```tsx
<EmployeeCard employee={employee} variant="detailed" />
```

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│ [Avatar XL]  Name  [Type] [Status]      ┌──────────┐  │
│              Furigana • #EmpId          │ ビザ     │  │
│              📍 Country  Gender  Age歳   │ 有効     │  │
│                                          └──────────┘  │
├────────────────────────────────────────────────────────┤
│ 🏢 勤務情報              │ 📅 日程                    │
│   派遣先: ABC Corp       │   入社日: 2022-04-01       │
│   部署: Manufacturing    │   ビザ期限: 2026-03-31     │
│   業務: Assembly         │   ビザ種類: 技能実習       │
├──────────────────────────┼─────────────────────────────┤
│ 📞 連絡先                │ 💳 給与情報                │
│   〒: 123-4567           │   時給: ¥1,200             │
│   住所: Tokyo...         │   請求: ¥1,800             │
│                          │   利益: ¥600               │
└────────────────────────────────────────────────────────┘
```

**Use cases:**
- Employee detail pages
- Profile modals
- Print views

---

## Features

### Automatic Visa Status Calculation

The component automatically calculates visa status based on `visaExpiry` date:

| Status | Condition | Color | Label |
|--------|-----------|-------|-------|
| `expired` | Past date | 🔴 Red | 期限切れ |
| `urgent` | < 30 days | 🟠 Orange | {days}日 |
| `warning` | < 90 days | 🟡 Yellow | {days}日 |
| `ok` | >= 90 days | 🟢 Green | 有効 |

```tsx
// Visa expiring in 15 days
<EmployeeCard employee={{ ...employee, visaExpiry: '2025-01-12' }} />
// Shows: 🟠 ビザ: 15日
```

### Staff Type Badges

| Type | Japanese | Badge Color |
|------|----------|-------------|
| `GenzaiX` | 派遣 | Blue |
| `Ukeoi` | 請負 | Purple |

### Status Badges

| Status | Color |
|--------|-------|
| 現在 (Current) | Green |
| 退職 (Resigned) | Gray |
| 休職 (Leave) | Yellow |

### Financial Information

When `showFinancials={true}`:

```tsx
<EmployeeCard
  employee={employee}
  showFinancials={true}
/>
```

Displays:
- 時給 (Hourly wage): ¥{hourlyWage}
- 請求 (Billing unit): ¥{billingUnit}
- 利益 (Profit margin): +¥{profitMargin} (green)

---

## Examples

### Basic List

```tsx
function EmployeeList({ employees }: { employees: StaffMember[] }) {
  return (
    <div className="space-y-2">
      {employees.map(emp => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          variant="compact"
          onClick={(e) => console.log('Selected:', e.empId)}
        />
      ))}
    </div>
  );
}
```

### Dashboard Grid

```tsx
function EmployeeDashboard({ employees }: { employees: StaffMember[] }) {
  const [selected, setSelected] = useState<StaffMember | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map(emp => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          variant="default"
          showFinancials={true}
          onClick={setSelected}
          className="hover:scale-[1.02]"
        />
      ))}
    </div>
  );
}
```

### Detail Modal

```tsx
function EmployeeModal({ employee, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <EmployeeCard
          employee={employee}
          variant="detailed"
          showFinancials={true}
        />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

### Filtered by Type

```tsx
function GenzaiXList({ employees }: { employees: StaffMember[] }) {
  const genzaiX = employees.filter(e => e.type === 'GenzaiX');

  return (
    <div className="space-y-3">
      <h2>派遣社員 ({genzaiX.length})</h2>
      {genzaiX.map(emp => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
    </div>
  );
}
```

### Visa Alerts

```tsx
function VisaAlertList({ employees }: { employees: StaffMember[] }) {
  const urgentVisa = employees.filter(emp => {
    if (!emp.visaExpiry) return false;
    const days = Math.ceil(
      (new Date(emp.visaExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 && days < 90;
  });

  return (
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="text-yellow-800 font-bold mb-3">
        ⚠️ Visa Expiring Soon ({urgentVisa.length})
      </h3>
      {urgentVisa.map(emp => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          variant="compact"
        />
      ))}
    </div>
  );
}
```

---

## Styling

### Base Classes

The component uses Tailwind CSS with these base styles:

```css
/* Card container */
.employee-card {
  @apply bg-white rounded-lg border border-slate-200;
  @apply hover:border-blue-300 hover:shadow-md;
  @apply transition-all duration-200;
}

/* Clickable state */
.employee-card--clickable {
  @apply cursor-pointer;
}
```

### Custom Styling

Pass custom classes via `className` prop:

```tsx
<EmployeeCard
  employee={employee}
  className="shadow-lg border-2 border-blue-500"
/>
```

### Dark Mode (Custom)

```tsx
<EmployeeCard
  employee={employee}
  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
/>
```

---

## Accessibility

- Uses semantic HTML (`<h3>`, `<p>`)
- Icons have `aria-hidden="true"` (decorative)
- Click handlers support keyboard navigation
- Color is not the only indicator (icons + text)
- Sufficient color contrast ratios

### Keyboard Navigation

When `onClick` is provided, the card is focusable and can be activated with Enter/Space.

---

## Related Components

| Component | Description |
|-----------|-------------|
| `AvatarDisplay` | Employee photo/avatar display |
| `StaffTable` | Tabular employee listing |
| `StaffForm` | Employee data entry form |
| `StatsDashboard` | Employee statistics overview |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-28 | Initial release |

---

## Contributing

When modifying this component:

1. Update TypeScript types in `types.ts` if adding new fields
2. Add tests in `tests/EmployeeCard.test.tsx`
3. Update this documentation
4. Follow existing code style and patterns

---

*Generated with `/docs-gen` command*
