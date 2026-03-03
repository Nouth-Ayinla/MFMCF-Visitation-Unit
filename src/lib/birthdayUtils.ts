// Birthday utilities for MM-DD format (e.g., "02-06" for February 6th)

export interface BirthdayMember {
  id: string;
  full_name: string;
  date_of_birth: string; // MM-DD format
  phone_number: string | null;
  level_number: string | null;
  daysUntil: number;
}

// Parse MM-DD string to month and day numbers
const parseMonthDay = (dateOfBirth: string): { month: number; day: number } | null => {
  if (!dateOfBirth) return null;
  
  const parts = dateOfBirth.split('-');
  if (parts.length !== 2) return null;
  
  const month = parseInt(parts[0], 10) - 1; // 0-indexed month
  const day = parseInt(parts[1], 10);
  
  if (isNaN(month) || isNaN(day)) return null;
  return { month, day };
};

// Check if today is someone's birthday (comparing month and day only)
export const isBirthdayToday = (dateOfBirth: string): boolean => {
  const parsed = parseMonthDay(dateOfBirth);
  if (!parsed) return false;
  
  const today = new Date();
  return today.getMonth() === parsed.month && today.getDate() === parsed.day;
};

// Get days until next birthday
export const getDaysUntilBirthday = (dateOfBirth: string): number => {
  const parsed = parseMonthDay(dateOfBirth);
  if (!parsed) return 365;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextBirthday = new Date(today.getFullYear(), parsed.month, parsed.day);
  nextBirthday.setHours(0, 0, 0, 0);
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format birthday for display (e.g., "Feb 06")
export const formatBirthday = (dateOfBirth: string): string => {
  const parsed = parseMonthDay(dateOfBirth);
  if (!parsed) return dateOfBirth;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parsed.month]} ${String(parsed.day).padStart(2, '0')}`;
};

// Get month number from MM-DD format (0-indexed)
export const getMonthFromBirthday = (dateOfBirth: string): number => {
  const parsed = parseMonthDay(dateOfBirth);
  return parsed ? parsed.month : -1;
};

// Sort members by upcoming birthday
export const sortByUpcomingBirthday = (members: BirthdayMember[]): BirthdayMember[] => {
  return [...members].sort((a, b) => a.daysUntil - b.daysUntil);
};
