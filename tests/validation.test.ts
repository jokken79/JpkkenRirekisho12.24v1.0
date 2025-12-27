import { describe, it, expect } from 'vitest';
import {
  staffMemberSchema,
  applicationSchema,
  rirekishoSchema,
  validateForm,
} from '../lib/validation';

describe('Staff Member Validation', () => {
  it('should validate a complete staff member', () => {
    const validStaff = {
      type: 'GenzaiX',
      empId: 'EMP001',
      fullName: 'Tanaka Taro',
      status: 'Active',
      hourlyWage: 1200,
      department: 'Manufacturing',
    };

    const result = validateForm(staffMemberSchema, validStaff);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should reject staff without required fields', () => {
    const invalidStaff = {
      type: 'GenzaiX',
      // Missing empId, fullName, status
    };

    const result = validateForm(staffMemberSchema, invalidStaff);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.empId).toBeDefined();
    expect(result.errors?.fullName).toBeDefined();
  });

  it('should reject negative hourly wage', () => {
    const invalidStaff = {
      type: 'GenzaiX',
      empId: 'EMP001',
      fullName: 'Test',
      status: 'Active',
      hourlyWage: -100,
    };

    const result = validateForm(staffMemberSchema, invalidStaff);
    expect(result.success).toBe(false);
    expect(result.errors?.hourlyWage).toContain('negative');
  });

  it('should validate postal code format', () => {
    const staffWithValidPostal = {
      type: 'GenzaiX',
      empId: 'EMP001',
      fullName: 'Test',
      status: 'Active',
      postalCode: '123-4567',
    };

    const result = validateForm(staffMemberSchema, staffWithValidPostal);
    expect(result.success).toBe(true);
  });

  it('should reject invalid postal code format', () => {
    const staffWithInvalidPostal = {
      type: 'GenzaiX',
      empId: 'EMP001',
      fullName: 'Test',
      status: 'Active',
      postalCode: 'invalid',
    };

    const result = validateForm(staffMemberSchema, staffWithInvalidPostal);
    expect(result.success).toBe(false);
    expect(result.errors?.postalCode).toBeDefined();
  });
});

describe('Application Validation', () => {
  it('should validate a complete application', () => {
    const validApp = {
      resumeId: 1,
      type: 'GenzaiX',
      status: 'draft',
      factoryName: 'Toyota Factory',
      startDate: '2024-01-15',
      hourlyWage: 1200,
    };

    const result = validateForm(applicationSchema, validApp);
    expect(result.success).toBe(true);
  });

  it('should reject application without factory name', () => {
    const invalidApp = {
      resumeId: 1,
      type: 'GenzaiX',
      status: 'draft',
      factoryName: '', // Empty
      startDate: '2024-01-15',
    };

    const result = validateForm(applicationSchema, invalidApp);
    expect(result.success).toBe(false);
    expect(result.errors?.factoryName).toBeDefined();
  });

  it('should reject invalid status', () => {
    const invalidApp = {
      resumeId: 1,
      type: 'GenzaiX',
      status: 'invalid_status' as any,
      factoryName: 'Test Factory',
      startDate: '2024-01-15',
    };

    const result = validateForm(applicationSchema, invalidApp);
    expect(result.success).toBe(false);
  });
});

describe('Rirekisho Validation', () => {
  it('should validate a complete resume', () => {
    const validResume = {
      applicantId: 'UNS-000001',
      nameKanji: '田中太郎',
      nameFurigana: 'タナカタロウ',
      interviewResult: 'passed',
    };

    const result = validateForm(rirekishoSchema, validResume);
    expect(result.success).toBe(true);
  });

  it('should reject resume without applicant ID', () => {
    const invalidResume = {
      applicantId: '',
      nameKanji: '田中太郎',
    };

    const result = validateForm(rirekishoSchema, invalidResume);
    expect(result.success).toBe(false);
    expect(result.errors?.applicantId).toBeDefined();
  });

  it('should accept valid interview results only', () => {
    const validResults = ['passed', 'failed', 'pending'];

    validResults.forEach((result) => {
      const resume = {
        applicantId: 'UNS-000001',
        nameKanji: 'Test',
        interviewResult: result,
      };

      const validation = validateForm(rirekishoSchema, resume);
      expect(validation.success).toBe(true);
    });
  });
});
