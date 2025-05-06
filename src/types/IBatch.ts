import { Document, Types } from 'mongoose';

interface IBatchReport {
  totalClasses: number;
  totalDuration: number;
  completedClasses: number;
  cancelledClasses: number;
  rescheduledClasses: number;
  pendingClasses: number;
  totalStudents: number;
  averageAttendance: number;
  syllabusProgress: number;
  lastUpdated: Date;
}

interface ISchedule {
  days: string[];
  startTime: string;
  endTime: string;
  timezone: string;
}

interface IBatch extends Document {
  name: string;
  standard: string;
  subjects: string[];
  mentor: Types.ObjectId;
  shareCode: string;
  shareLink: string | null;
  schedule: ISchedule;
  batchReports: IBatchReport[];
  status: 'Active' | 'Inactive' | 'Completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;

  // Methods
  getClassStats(): {
    totalClasses: number;
    completedClasses: number;
    cancelledClasses: number;
    pendingClasses: number;
  };
  regenerateShareCode(): Promise<{
    shareCode: string;
    shareLink: string;
  }>;
  updateBatchReport(): Promise<IBatchReport>;
}

export default IBatch;