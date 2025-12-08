import { format } from "date-fns";

export interface BirthdayMember {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string | null;
  daysUntil: number;
}

// Check if today is someone's birthday (comparing month and day only)
export const isBirthdayToday = (dateOfBirth: string): boolean => {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
};

// Get days until next birthday
export const getDaysUntilBirthday = (dateOfBirth: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dob = new Date(dateOfBirth);
  const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  nextBirthday.setHours(0, 0, 0, 0);
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format birthday for display (e.g., "Nov 27")
export const formatBirthday = (dateOfBirth: string): string => {
  const dob = new Date(dateOfBirth);
  return format(dob, 'MMM dd');
};

// Get age from date of birth
export const getAge = (dateOfBirth: string): number => {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

// Sort members by upcoming birthday
export const sortByUpcomingBirthday = (members: BirthdayMember[]): BirthdayMember[] => {
  return [...members].sort((a, b) => a.daysUntil - b.daysUntil);
};
