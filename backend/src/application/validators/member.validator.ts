import { z } from 'zod';

export const registerMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  phoneNumber: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^(\+?234|0)?[789]\d{9}$/, 'Please enter a valid Nigerian phone number'),
  address: z.string().trim().max(200, 'Address must be less than 200 characters').optional(),
  birthMonth: z.string().min(1, 'Birth month is required').max(2),
  birthDay: z.string().min(1, 'Birth day is required').max(2),
  gender: z.enum(['Male', 'Female']).optional(),
  levelId: z.string().min(1, 'Level is required'),
  departmentId: z.string().min(1, 'Department is required'),
  departmentOther: z.string().trim().max(100).optional(),
  howDidYouHear: z.string().trim().max(200).optional(),
  isFirstTimer: z.boolean().default(true),
});

export type RegisterMemberDTO = z.infer<typeof registerMemberSchema>;
