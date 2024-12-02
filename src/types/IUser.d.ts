import { Document } from "mongoose";

interface IUser extends Document {
  firstname: string;
  lastname?: string;
  email: string;
  phone?: {
    personal?: number;
    other?: number;
  };
  password: string;
  salt: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  about?: {
    college?: string;
    degree?: string;
    dob?: string; 
    gender?: string;
  };
  students: Array<{ id: mongoose.Types.ObjectId }>;
  createdAt?: Date; 
  resetPasswordToken?: string | null;
  resetTokenExpiry?: string | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getToken(): Promise<string>;
}

export default IUser;
