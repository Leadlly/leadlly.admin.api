import mongoose, { Schema, Document } from 'mongoose';

export interface IInstitute extends Document {
  name: string;
  logo: string;
  description: string;
  address: string;
  contactNumber: string;
  email: string;
  website?: string;
  admins: mongoose.Types.ObjectId[];
  batches: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const instituteSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Institute name is required'],
    trim: true
  },
  logo: {
    type: String,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  email: {
    type: String,
    // unique: true,
    lowercase: true
  },
  website: {
    type: String
  },
  subjects: [{
    type: String,
    required: true,
    lowercase: true
  }],
  standards: [{
    type: String,
    required: true,
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    required: true
  }],
  batches: [{
    type: Schema.Types.ObjectId,
    ref: 'Batch'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IInstitute>('Institute', instituteSchema);