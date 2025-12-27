import { z } from 'zod';

// Staff Member validation schema
export const staffMemberSchema = z.object({
  type: z.enum(['GenzaiX', 'Ukeoi']),

  // Required fields
  empId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  status: z.string().min(1, 'Status is required'),

  // Optional identification fields
  furigana: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().min(0).max(120).optional(),

  // Work assignment
  dispatchId: z.string().optional(),
  dispatchCompany: z.string().optional(),
  department: z.string().optional(),
  line: z.string().optional(),
  jobContent: z.string().optional(),
  contractWork: z.string().optional(),

  // Financial - ensure non-negative numbers
  hourlyWage: z.number().min(0, 'Hourly wage cannot be negative').optional(),
  wageRevision: z.string().optional(),
  billingUnit: z.number().min(0, 'Billing unit cannot be negative').optional(),
  billingRevision: z.string().optional(),
  profitMargin: z.number().optional(),
  standardRemuneration: z.number().min(0).optional(),

  // Insurance
  healthIns: z.union([z.number(), z.string()]).optional(),
  nursingIns: z.union([z.number(), z.string()]).optional(),
  pension: z.union([z.number(), z.string()]).optional(),
  socialInsStatus: z.string().optional(),

  // Visa
  visaExpiry: z.string().optional(),
  visaAlert: z.string().optional(),
  visaType: z.string().optional(),

  // Location
  postalCode: z.string().regex(/^[0-9]{3}-?[0-9]{4}$/, 'Invalid postal code format').optional().or(z.literal('')),
  address: z.string().optional(),
  apartment: z.string().optional(),

  // Dates
  hireDate: z.string().optional(),
  resignDate: z.string().optional(),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),

  // Banking (Ukeoi)
  bankAccountHolder: z.string().optional(),
  bankName: z.string().optional(),
  branchNum: z.string().optional(),
  branchName: z.string().optional(),
  accountNum: z.string().optional(),

  // Other
  remarks: z.string().optional(),
  resumeId: z.number().optional(),
  isShaku: z.boolean().optional(),
});

// Application validation schema
export const applicationSchema = z.object({
  resumeId: z.number().min(1, 'Resume is required'),
  type: z.enum(['GenzaiX', 'Ukeoi']),
  status: z.enum(['draft', 'pending', 'approved', 'completed']),
  factoryName: z.string().min(1, 'Factory name is required'),
  department: z.string().optional(),
  hourlyWage: z.number().min(0, 'Hourly wage cannot be negative').optional(),
  billingUnit: z.number().min(0, 'Billing unit cannot be negative').optional(),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
});

// Resume/Rirekisho validation schema
export const rirekishoSchema = z.object({
  applicantId: z.string().min(1, 'Applicant ID is required'),
  nameKanji: z.string().min(1, 'Name (Kanji) is required'),
  nameFurigana: z.string().optional(),
  nameRomanji: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().min(0).max(120).optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),

  // Contact
  address: z.string().optional(),
  postalCode: z.string().optional(),
  mobile: z.string().optional(),
  phone: z.string().optional(),

  // Visa
  visaType: z.string().optional(),
  visaPeriod: z.string().optional(),
  residenceCardNo: z.string().optional(),

  // Physical
  height: z.string().optional(),
  weight: z.string().optional(),

  // Evaluation
  interviewResult: z.enum(['passed', 'failed', 'pending']).optional(),
  evaluationNotes: z.string().optional(),
  reasonForApplying: z.string().optional(),
  selfPR: z.string().optional(),
});

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to a simple key-value object
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

// Type exports
export type StaffMemberInput = z.infer<typeof staffMemberSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type RirekishoInput = z.infer<typeof rirekishoSchema>;
