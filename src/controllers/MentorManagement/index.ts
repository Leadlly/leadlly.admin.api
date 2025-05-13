import { Request, Response, NextFunction } from "express";
import { db } from "../../db/db";
import { CustomError } from "../../middleware/error";
import mongoose from "mongoose";
import { sendMail } from "../../utils/sendMail";
import Institute from "../../models/instituteModel";
import crypto from "crypto";

export const getMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentors = await db.collection('mentors').find().toArray();
  
      if (!mentors || mentors.length === 0) {
        return next(new CustomError("No mentors found", 404));
      }
  
      res.status(200).json({
        success: true,
        mentors
      });
  
    } catch (error: any) {
      next(new CustomError(error.message));
    }
  };
  
  export const verifyMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.id;
  
      const mentor = await db.collection('mentors').findOne({ _id: new mongoose.Types.ObjectId(mentorId) });
  
      if (!mentor) {
        return next(new CustomError("Mentor not found", 404));
      }
  
      const newStatus = req.body.status;
  
 
      
      const updateQuery = {
        filter: { _id: new mongoose.Types.ObjectId(mentorId) },
        update: { $set: { status: newStatus } }
      };
      
      await db.collection('mentors').updateOne(updateQuery.filter, updateQuery.update);
  
      res.status(200).json({
        success: true,
        message: `Mentor ${newStatus}`
      });
  
    } catch (error: any) {
      next(new CustomError(error.message));
    }
  };

  export const getMentorWithStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.id;
      const objectId = new mongoose.Types.ObjectId(mentorId);
  
      console.log(`Mentor ID: ${mentorId}`);
      console.log(`Object ID: ${objectId}`);
  
      // Fetch the mentor and their allocated students
      const mentor = await db.collection('mentors').aggregate([
        {
          $match: { _id: objectId }
        },
        {
          $lookup: {
            from: 'users',
            let: { studentIds: "$students._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$studentIds"]
                  }
                }
              },
              {
                $project: {
                  _id: 1,
                  firstname: 1,
                  lastname: 1,
                  email: 1,
                  academic: 1,
                  mentor: 1,
                }
              }
            ],
            as: 'students'
          }
        },
        {
          $project: {
            _id: 1,
            firstname: 1,
            lastname: 1,
            email: 1,
            students: 1
          }
        }
      ]).toArray();
  
      console.log(`Mentor Result: ${JSON.stringify(mentor, null, 2)}`);
  
      if (!mentor || mentor.length === 0) {
        return next(new CustomError("Mentor not found", 404));
      }
  
      // Fetch all students with a null mentor
      const unallocatedStudents = await db.collection('users').find({ "mentor._id": null }).project({
        _id: 1,
        firstname: 1,
        lastname: 1,
        email: 1,
        academic: 1,
        mentor: 1
      }).toArray();
  
      console.log(`Unallocated Students: ${JSON.stringify(unallocatedStudents, null, 2)}`);
  
      // Combine allocated and unallocated students
      const allStudents = mentor[0].students.concat(unallocatedStudents);
  
      res.status(200).json({
        success: true,
        mentor: {
          ...mentor[0],
          students: allStudents
        }
      });
  
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      next(new CustomError(error.message));
    }
  };



  


export const importTeachers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { emails } = req.body;
    const instituteId = req.params.instituteId;
    const Teacher = db.collection("mentors");
    
    if (!emails || !Array.isArray(emails)) {
      return next(new CustomError("Teacher emails must be provided as an array", 400));
    }
    
    // Fetch institute details
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return next(new CustomError("Institute not found", 404));
    }
    
    // Clean up emails array
    const emailList = emails.map((email: string) => email.trim()).filter((email: string) => email.length > 0);
    
    // Validate emails
    const invalidEmails = emailList.filter((email: string) => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      return next(new CustomError(`Invalid email format found in ${invalidEmails.length} records: ${invalidEmails.join(', ')}`, 400));
    }
    
    // Process each email and create teachers
    const results = await Promise.all(
      emailList.map(async (email: string) => {
        try {
          // Check if user already exists
          const existingUser = await Teacher.findOne({ email });
          if (existingUser) {
            return {
              email,
              status: "skipped",
              message: "User already exists"
            };
          }
          
          // Generate reset token
          const resetToken = crypto.randomBytes(20).toString("hex");
          const resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
          
          // Set expiry for 24 hours
          const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          // Create new user with email as firstname until they set their profile
          const newUser = await Teacher.insertOne({
            firstname: email.split('@')[0], // Use part before @ as temporary firstname
            lastname: "",
            email,
            resetPasswordToken,
            resetTokenExpiry,
            role: "teacher",
            institute: institute._id,
          });
          
          // Send reset password email
          const resetUrl = `${req.protocol}://${process.env.MENTOR_WEB_URL}/reset-password/${resetToken}`;
          
          await sendMail({
            email,
            subject: "Set Your Password",
            message: `Welcome to our platform! Please click the link below to set your password: ${resetUrl}`,
            tag: "reset"
          });
          
          return {
            email,
            status: "success",
            message: "User created and email sent"
          };
        } catch (error: any) {
          console.log(error)
          return {
            email,
            status: "error",
            message: error.message
          };
        }
      })
    );
    
    // Count results
    const successCount = results.filter(r => r.status === "success").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;
    const errorCount = results.filter(r => r.status === "error").length;
    
    res.status(200).json({
      success: true,
      message: `Processed ${emailList.length} teachers: ${successCount} added, ${skippedCount} skipped, ${errorCount} failed`,
      details: results
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}