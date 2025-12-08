import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type WidgetType = 
  | 'stats_members'
  | 'stats_firsttimers'
  | 'stats_attendance'
  | 'stats_rate'
  | 'attendance_trend'
  | 'level_distribution'
  | 'recent_activity'
  | 'quick_actions'
  | 'birthdays';

interface DashboardLayout {
  widgets: WidgetType[];
  addWidget: (widget: WidgetType) => void;
  removeWidget: (widget: WidgetType) => void;
  resetLayout: () => void;
}

const DEFAULT_SUPER_ADMIN_WIDGETS: WidgetType[] = [
  'stats_members',
  'stats_firsttimers',
  'stats_attendance',
  'stats_rate',
  'quick_actions',
  'birthdays',
  'attendance_trend',
  'level_distribution',
  'recent_activity',
];

const DEFAULT_LEVEL_COORDINATOR_WIDGETS: WidgetType[] = [
  'stats_members',
  'stats_attendance',
  'quick_actions',
  'birthdays',
  'attendance_trend',
  'recent_activity',
];

const DEFAULT_USER_WIDGETS: WidgetType[] = [
  'stats_members',
  'stats_firsttimers',
  'recent_activity',
];

export const useDashboardLayout = (): DashboardLayout => {
  const { isSuperAdmin, userRole } = useAuth();
  const [widgets, setWidgets] = useState<WidgetType[]>([]);

  const getDefaultWidgets = (): WidgetType[] => {
    if (isSuperAdmin()) return DEFAULT_SUPER_ADMIN_WIDGETS;
    if (userRole === 'level_coordinator') return DEFAULT_LEVEL_COORDINATOR_WIDGETS;
    return DEFAULT_USER_WIDGETS;
  };

  useEffect(() => {
    const storageKey = `dashboard_layout_${userRole || 'default'}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      setWidgets(JSON.parse(stored));
    } else {
      const defaultWidgets = getDefaultWidgets();
      setWidgets(defaultWidgets);
      localStorage.setItem(storageKey, JSON.stringify(defaultWidgets));
    }
  }, [userRole]);

  const addWidget = (widget: WidgetType) => {
    setWidgets(prev => {
      const updated = [...prev, widget];
      const storageKey = `dashboard_layout_${userRole || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const removeWidget = (widget: WidgetType) => {
    setWidgets(prev => {
      const updated = prev.filter(w => w !== widget);
      const storageKey = `dashboard_layout_${userRole || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const resetLayout = () => {
    const defaultWidgets = getDefaultWidgets();
    setWidgets(defaultWidgets);
    const storageKey = `dashboard_layout_${userRole || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(defaultWidgets));
  };

  return {
    widgets,
    addWidget,
    removeWidget,
    resetLayout,
  };
};
