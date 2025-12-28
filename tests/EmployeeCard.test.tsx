import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeCard from '../components/EmployeeCard';
import { StaffMember } from '../types';

// Mock AvatarDisplay component
vi.mock('../components/AvatarDisplay', () => ({
  default: ({ alt, size }: { alt: string; size: string }) => (
    <div data-testid="avatar" data-alt={alt} data-size={size}>Avatar</div>
  ),
}));

// Sample employee data
const mockGenzaiXEmployee: StaffMember = {
  id: 1,
  type: 'GenzaiX',
  status: '現在',
  empId: 'EMP001',
  fullName: 'グエン ヴァン A',
  furigana: 'グエン ヴァン エー',
  gender: '男',
  nationality: 'ベトナム',
  birthDate: '1990-05-15',
  age: 34,
  dispatchCompany: 'ABC Manufacturing',
  department: '製造部',
  jobContent: '組立作業',
  hourlyWage: 1200,
  billingUnit: 1800,
  profitMargin: 600,
  hireDate: '2022-04-01',
  visaExpiry: '2026-03-31',
  visaType: '技能実習',
  postalCode: '123-4567',
  address: '東京都新宿区1-2-3',
  avatar: 'employee1.jpg',
};

const mockUkeoiEmployee: StaffMember = {
  id: 2,
  type: 'Ukeoi',
  status: '現在',
  empId: 'EMP002',
  fullName: 'ブイ ティ B',
  furigana: 'ブイ ティ ビー',
  gender: '女',
  nationality: 'ベトナム',
  department: '検品部',
  contractWork: '検品業務',
  hourlyWage: 1100,
  hireDate: '2023-01-15',
};

const expiredVisaEmployee: StaffMember = {
  ...mockGenzaiXEmployee,
  id: 3,
  visaExpiry: '2024-01-01', // Expired
};

const urgentVisaEmployee: StaffMember = {
  ...mockGenzaiXEmployee,
  id: 4,
  visaExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
};

describe('EmployeeCard Component', () => {
  describe('Compact Variant', () => {
    it('renders employee name and company', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="compact" />);

      expect(screen.getByText('グエン ヴァン A')).toBeInTheDocument();
      expect(screen.getByText('ABC Manufacturing')).toBeInTheDocument();
    });

    it('shows GenzaiX badge as 派遣', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="compact" />);

      expect(screen.getByText('派遣')).toBeInTheDocument();
    });

    it('shows Ukeoi badge as 請負', () => {
      render(<EmployeeCard employee={mockUkeoiEmployee} variant="compact" />);

      expect(screen.getByText('請負')).toBeInTheDocument();
    });

    it('renders avatar with correct props', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="compact" />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'sm');
      expect(avatar).toHaveAttribute('data-alt', 'グエン ヴァン A');
    });

    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="compact" onClick={handleClick} />);

      fireEvent.click(screen.getByText('グエン ヴァン A'));

      expect(handleClick).toHaveBeenCalledWith(mockGenzaiXEmployee);
    });
  });

  describe('Default Variant', () => {
    it('renders employee details', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      expect(screen.getByText('グエン ヴァン A')).toBeInTheDocument();
      expect(screen.getByText(/グエン ヴァン エー/)).toBeInTheDocument();
      expect(screen.getByText(/#EMP001/)).toBeInTheDocument();
      expect(screen.getByText('現在')).toBeInTheDocument();
    });

    it('shows dispatch company and nationality', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      expect(screen.getByText('ABC Manufacturing')).toBeInTheDocument();
      expect(screen.getByText('ベトナム')).toBeInTheDocument();
    });

    it('shows hire date when available', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      expect(screen.getByText('2022-04-01')).toBeInTheDocument();
    });

    it('does not show financial info by default', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      expect(screen.queryByText(/時給:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/¥1,200/)).not.toBeInTheDocument();
    });

    it('shows financial info when showFinancials is true', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} showFinancials={true} />);

      expect(screen.getByText(/時給: ¥1,200/)).toBeInTheDocument();
      expect(screen.getByText(/請求: ¥1,800/)).toBeInTheDocument();
      expect(screen.getByText(/\+¥600/)).toBeInTheDocument();
    });

    it('uses lg avatar size', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Detailed Variant', () => {
    it('renders all employee information', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="detailed" />);

      expect(screen.getByText('グエン ヴァン A')).toBeInTheDocument();
      expect(screen.getByText(/34歳/)).toBeInTheDocument();
      expect(screen.getByText('男')).toBeInTheDocument();
    });

    it('shows work information section', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="detailed" />);

      expect(screen.getByText('勤務情報')).toBeInTheDocument();
      expect(screen.getByText(/派遣先:/)).toBeInTheDocument();
      expect(screen.getByText(/部署:/)).toBeInTheDocument();
      expect(screen.getByText(/業務:/)).toBeInTheDocument();
    });

    it('shows dates section', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="detailed" />);

      expect(screen.getByText('日程')).toBeInTheDocument();
      expect(screen.getByText(/入社日:/)).toBeInTheDocument();
      expect(screen.getByText(/ビザ期限:/)).toBeInTheDocument();
      expect(screen.getByText(/ビザ種類:/)).toBeInTheDocument();
    });

    it('shows contact section', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="detailed" />);

      expect(screen.getByText('連絡先')).toBeInTheDocument();
      expect(screen.getByText(/〒:/)).toBeInTheDocument();
      expect(screen.getByText(/住所:/)).toBeInTheDocument();
    });

    it('uses xl avatar size', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} variant="detailed" />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'xl');
    });
  });

  describe('Visa Status Indicator', () => {
    it('shows valid visa status for far expiry date', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      expect(screen.getByText(/ビザ: 有効/)).toBeInTheDocument();
    });

    it('shows expired status for past expiry date', () => {
      render(<EmployeeCard employee={expiredVisaEmployee} />);

      expect(screen.getByText(/ビザ: 期限切れ/)).toBeInTheDocument();
    });

    it('shows urgent status for expiry within 30 days', () => {
      render(<EmployeeCard employee={urgentVisaEmployee} />);

      // Should show days remaining
      expect(screen.getByText(/ビザ: \d+日/)).toBeInTheDocument();
    });

    it('does not show visa status when no expiry date', () => {
      const noVisaEmployee = { ...mockUkeoiEmployee, visaExpiry: undefined };
      render(<EmployeeCard employee={noVisaEmployee} />);

      expect(screen.queryByText(/ビザ:/)).not.toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('shows green badge for 現在 status', () => {
      render(<EmployeeCard employee={mockGenzaiXEmployee} />);

      const statusBadge = screen.getByText('現在');
      expect(statusBadge).toHaveClass('bg-green-100');
    });

    it('shows gray badge for 退職 status', () => {
      const retiredEmployee = { ...mockGenzaiXEmployee, status: '退職' };
      render(<EmployeeCard employee={retiredEmployee} />);

      const statusBadge = screen.getByText('退職');
      expect(statusBadge).toHaveClass('bg-gray-100');
    });

    it('shows yellow badge for 休職 status', () => {
      const leaveEmployee = { ...mockGenzaiXEmployee, status: '休職' };
      render(<EmployeeCard employee={leaveEmployee} />);

      const statusBadge = screen.getByText('休職');
      expect(statusBadge).toHaveClass('bg-yellow-100');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EmployeeCard employee={mockGenzaiXEmployee} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has cursor-pointer when onClick is provided', () => {
      const { container } = render(
        <EmployeeCard employee={mockGenzaiXEmployee} onClick={() => {}} />
      );

      expect(container.firstChild).toHaveClass('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalEmployee: StaffMember = {
        type: 'GenzaiX',
        status: '現在',
        empId: 'EMP999',
        fullName: 'Test User',
      };

      render(<EmployeeCard employee={minimalEmployee} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      // Multiple "-" placeholders for missing values (dispatchCompany, nationality)
      const placeholders = screen.getAllByText('-');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('handles department fallback when dispatchCompany is missing', () => {
      render(<EmployeeCard employee={mockUkeoiEmployee} variant="compact" />);

      expect(screen.getByText('検品部')).toBeInTheDocument();
    });

    it('formats large numbers with locale string', () => {
      const highWageEmployee = { ...mockGenzaiXEmployee, hourlyWage: 10000 };
      render(<EmployeeCard employee={highWageEmployee} showFinancials={true} />);

      expect(screen.getByText(/¥10,000/)).toBeInTheDocument();
    });
  });
});
