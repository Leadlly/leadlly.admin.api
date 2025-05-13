import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { CustomError } from "../../middleware/error";
import { sendMail } from "../../utils/sendMail";
import { db } from "../../db/db";
import Institute from "../../models/instituteModel";
import mongoose from "mongoose";

export const importStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { emails } = req.body;
    const instituteId = req.params.instituteId;
    const User = db.collection("users");
    
    if (!emails || !Array.isArray(emails)) {
      return next(new CustomError("Student emails must be provided as an array", 400));
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
    
    // Process each email and create students
    const results = await Promise.all(
      emailList.map(async (email: string) => {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email });
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
          const newUser = await User.insertOne({
            firstname: email.split('@')[0], // Use part before @ as temporary firstname
            lastname: "",
            email,
            resetPasswordToken,
            resetTokenExpiry,
            role: "student",
            institute: {
              _id: institute._id,
              name: institute.name,
              logo: {
                key: institute.logo || null,
                url: institute.logo || null,
              },
            }
          });
          
          // Send reset password email
          const resetUrl = `${req.protocol}://${process.env.STUDENT_WEB_URL}/reset-password/${resetToken}`;
          
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
      message: `Processed ${emailList.length} students: ${successCount} added, ${skippedCount} skipped, ${errorCount} failed`,
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