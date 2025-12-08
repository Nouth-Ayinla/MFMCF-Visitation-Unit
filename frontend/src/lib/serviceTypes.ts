// Service type definitions for attendance system
export type ServiceType = 'bible_study' | 'revival_hour' | 'sunday_service';

export interface ServiceInfo {
  value: ServiceType;
  label: string;
  dayOfWeek: number; // 0 = Sunday, 2 = Tuesday, 4 = Thursday
  icon: string;
}

export const SERVICE_TYPES: ServiceInfo[] = [
  { value: 'bible_study', label: 'Bible Study', dayOfWeek: 2, icon: '📖' },
  { value: 'revival_hour', label: 'Revival Hour', dayOfWeek: 4, icon: '🔥' },
  { value: 'sunday_service', label: 'Sunday Service', dayOfWeek: 0, icon: '⛪' },
];

export const getServiceByType = (type: ServiceType): ServiceInfo | undefined => {
  return SERVICE_TYPES.find(s => s.value === type);
};

export const getServiceLabel = (type: ServiceType): string => {
  return getServiceByType(type)?.label || type;
};

// Get the most recent date for a given day of week
export const getMostRecentServiceDate = (dayOfWeek: number): Date => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay - dayOfWeek;
  
  const targetDate = new Date(today);
  if (diff >= 0) {
    // The day is today or earlier this week
    targetDate.setDate(today.getDate() - diff);
  } else {
    // The day hasn't happened this week yet, go to last week
    targetDate.setDate(today.getDate() - (7 + diff));
  }
  
  return targetDate;
};

// Get the next occurrence of a given day of week
export const getNextServiceDate = (dayOfWeek: number): Date => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = dayOfWeek - currentDay;
  
  const targetDate = new Date(today);
  if (diff > 0) {
    // The day is later this week
    targetDate.setDate(today.getDate() + diff);
  } else if (diff === 0) {
    // The day is today
    return targetDate;
  } else {
    // The day has passed, go to next week
    targetDate.setDate(today.getDate() + (7 + diff));
  }
  
  return targetDate;
};

// Check if a date is valid for a given service type
export const isValidServiceDay = (date: Date, serviceType: ServiceType): boolean => {
  const dayOfWeek = date.getDay();
  const service = getServiceByType(serviceType);
  return service ? dayOfWeek === service.dayOfWeek : false;
};

// Get quick date options for a service type
export const getQuickDateOptions = (serviceType: ServiceType): { label: string; date: Date }[] => {
  const service = getServiceByType(serviceType);
  if (!service) return [];
  
  const mostRecent = getMostRecentServiceDate(service.dayOfWeek);
  const lastWeek = new Date(mostRecent);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(mostRecent);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const options: { label: string; date: Date }[] = [];
  
  // Only include dates that are not in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (mostRecent <= today) {
    options.push({ label: 'This Week', date: mostRecent });
  }
  if (lastWeek <= today) {
    options.push({ label: 'Last Week', date: lastWeek });
  }
  if (twoWeeksAgo <= today) {
    options.push({ label: '2 Weeks Ago', date: twoWeeksAgo });
  }
  
  return options;
};

// Format date to YYYY-MM-DD string
export const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
