import mongoose, { Schema } from 'mongoose';
import IBatch from '../types/IBatch';
import crypto from 'crypto';

const batchReportSchema = new Schema({
  totalClasses: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  completedClasses: {
    type: Number,
    default: 0
  },
  cancelledClasses: {
    type: Number,
    default: 0
  },
  rescheduledClasses: {
    type: Number,
    default: 0
  },
  pendingClasses: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  averageAttendance: {
    type: Number, // percentage
    default: 0
  },
  syllabusProgress: {
    type: Number, // percentage
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const batchSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter batch name"],
    trim: true
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please specify the institute"],
  },
  standard: {
    type: String,
    required: [true, "Please specify the standard/grade"],
  },
  subjects: [{
    type: String,
    required: [true, "Please specify at least one subject"]
  }],
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  // students: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // }],
  shareCode: {
    type: String,
    unique: true,
    default: function() {
      // Generate a random 7-character alphanumeric code
      return crypto.randomBytes(4).toString('hex').substring(0, 7).toUpperCase();
    }
  },
  shareLink: {
    type: String,
    default: function() {
      // This will be set after document creation
      return null;
    }
  },
  schedule: {
    days: [String], // e.g., ["Monday", "Wednesday", "Friday"]
    startTime: String, // e.g., "16:00"
    endTime: String, // e.g., "17:30"
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    }
  },
  batchReports: [batchReportSchema],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    // required: true
  },
  endDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate share link after batch is created
batchSchema.post('save', function(doc) {
  if (!doc.shareLink) {
    // Update the shareLink based on the batch ID and shareCode
    doc.shareLink = `https://leadlly.in/join-batch/${doc.shareCode}`;
    // Save the document again to update the shareLink
    doc.save();
  }
});

// Method to get class statistics
batchSchema.methods.getClassStats = function() {
  const totalClasses = this.batchReports.length;
  const completedClasses = this.batchReports.filter(
      (report: { classStatus: string; }) => report.classStatus === 'Completed'
  ).length;
  const cancelledClasses = this.batchReports.filter(
      (report: { classStatus: string; }) => report.classStatus === 'Cancelled'
  ).length;
  
  return {
    totalClasses,
    completedClasses,
    cancelledClasses,
    pendingClasses: totalClasses - completedClasses - cancelledClasses
  };
};

// Method to regenerate share code
batchSchema.methods.regenerateShareCode = async function() {
  this.shareCode = crypto.randomBytes(4).toString('hex').substring(0, 7).toUpperCase();
  this.shareLink = `https://leadlly.com/join-batch/${this.shareCode}`;
  await this.save();
  return {
    shareCode: this.shareCode,
    shareLink: this.shareLink
  };
};

// Method to update batch report
batchSchema.methods.updateBatchReport = async function() {
  const classStats = this.getClassStats();
  const totalStudents = this.students ? this.students.length : 0;
  
  // Calculate average attendance from batch reports
  const attendanceSum = this.batchReports.reduce((sum: any, report: { attendedStudents: string | any[]; }) => {
    return sum + (report.attendedStudents ? report.attendedStudents.length : 0);
  }, 0);
  
  const averageAttendance = totalStudents > 0 && this.batchReports.length > 0
    ? (attendanceSum / (totalStudents * this.batchReports.length)) * 100
    : 0;

  // Calculate total duration from all completed classes
  const totalDuration = this.batchReports.reduce((sum: any, report: { classStatus: string; duration: any; }) => {
    // Only count duration for completed classes
    return report.classStatus === 'Completed' ? sum + (report.duration || 0) : sum;
  }, 0);

  // Calculate syllabus progress based on completed classes vs total planned classes
  const syllabusProgress = this.batchReports.length > 0
    ? (classStats.completedClasses / this.batchReports.length) * 100
    : 0;

  const report = {
    totalClasses: classStats.totalClasses,
    completedClasses: classStats.completedClasses,
    cancelledClasses: classStats.cancelledClasses,
    rescheduledClasses: this.batchReports.filter((r: { classStatus: string; }) => r.classStatus === 'Rescheduled').length,
    pendingClasses: classStats.pendingClasses,
    totalStudents,
    totalDuration,
    averageAttendance: Math.round(averageAttendance),
    syllabusProgress: Math.round(syllabusProgress),
    lastUpdated: new Date()
  };

  this.batchReport = report;
  await this.save();
  return this.batchReport;
};

const Batch = mongoose.model<IBatch>('Batch', batchSchema);

export default Batch;