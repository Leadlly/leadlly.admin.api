import { Document } from 'mongoose';

interface IAdmin extends Document {
  firstname: string;
  lastname: string;
  email: string;
  role: 'admin' | 'superadmin';
  phone: string;
  password: string;
  salt: string;
  avatar: {
    public_id: string;
    url: string;
  };
  permissions: {
    manageUsers: boolean;
    manageBatches: boolean;
    manageClasses: boolean;
    manageTeachers: boolean;
    manageStudents: boolean;
    managePayments: boolean;
    manageReports: boolean;
    manageSettings: boolean;
    manageAdmins: boolean;
  };
  lastLogin: Date | null;
  status: 'Active' | 'Inactive' | 'Suspended';
  activityLog: Array<{
    action: string;
    timestamp: Date;
    details?: string;
    ipAddress?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken: string | null;
  resetTokenExpiry: Date | null;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getToken(): Promise<string>;
  logActivity(action: string, details?: string, ipAddress?: string): void;
}

export default IAdmin;