import { z } from 'zod';

export const dashboardStatsSchema = z.object({
  totalPatients: z.number(),
  todayAppointments: z.number(),
  completedToday: z.number(),
  todayRevenue: z.number(),
  avgWaitTime: z.number(),
  newPatientsToday: z.number(),
  newPatientsWeek: z.number(),
  newPatientsMonth: z.number(),
  visitsToday: z.number(),
  visitsWeek: z.number(),
  visitsMonth: z.number(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
