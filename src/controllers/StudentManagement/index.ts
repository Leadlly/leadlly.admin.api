import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Readable } from "stream";
import { CustomError } from "../../middleware/error";
import { sendMail } from "../../utils/sendMail";
import { db } from "../../db/db";


export const importStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileType, data } = req.body;
    const User = db.collection("users");
    
    if (!fileType || !data) {
      return next(new CustomError("File type and data are required", 400));
    }
    
    let students: { firstname: string; lastname: string; email: string }[] = [];
    
    // Parse data based on file type
    if (fileType === "csv") {
      // Parse CSV data
      const results: any[] = [];
      const readableStream = Readable.from([data]);
      
      // await new Promise((resolve, reject) => {
      //   readableStream
      //     .pipe(csv())
      //     .on("data", (row) => results.push(row))
      //     .on("end", resolve)
      //     .on("error", reject);
      // });
      
      students = results.map(row => ({
        firstname: row.firstname || row.firstName || row["First Name"] || "",
        lastname: row.lastname || row.lastName || row["Last Name"] || "",
        email: row.email || row.Email || row["Email Address"] || ""
      }));
    } 
    else if (fileType === "excel") {
      // Parse Excel data
      // const workbook = xlsx.read(data, { type: "buffer" });
      // const sheetName = workbook.SheetNames[0];
      // const worksheet = workbook.Sheets[sheetName];
      // const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      // students = jsonData.map((row: any) => ({
      //   firstname: row.firstname || row.firstName || row["First Name"] || "",
      //   lastname: row.lastname || row.lastName || row["Last Name"] || "",
      //   email: row.email || row.Email || row["Email Address"] || ""
      // }));
    } 
    else if (fileType === "text") {
      // Parse comma-separated text
      const lines = data.split("\n");
      
      students = lines.map((line: string): { firstname: string; lastname: string; email: string } => {
        const [email, firstname = "", lastname = ""] = line.split(",").map(item => item.trim());
        return { firstname, lastname, email };
      });
    } 
    else {
      return next(new CustomError("Invalid file type. Supported types: csv, excel, text", 400));
    }
    
    // Validate emails
    const invalidEmails = students.filter(student => !student.email || !isValidEmail(student.email));
    if (invalidEmails.length > 0) {
      return next(new CustomError(`Invalid email format found in ${invalidEmails.length} records`, 400));
    }
    
    // Insert students and send reset password emails
    const results = await Promise.all(
      students.map(async (student) => {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email: student.email });
          if (existingUser) {
            return {
              email: student.email,
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
          
          // Create new user
          const newUser = await User.insertOne({
            firstname: student.firstname,
            lastname: student.lastname,
            email: student.email,
            resetPasswordToken,
            resetTokenExpiry,
            role: "student" // Assuming 'student' is a valid role in your schema
          });
          
          // Send reset password email
          const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;
          
          await sendMail({
            email: student.email,
            subject: "Set Your Password",
            message: `Welcome to our platform! Please click the link below to set your password: ${resetUrl}`,
            tag: "reset"
          });
          
          return {
            email: student.email,
            status: "success",
            message: "User created and email sent"
          };
        } catch (error: any) {
          return {
            email: student.email,
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
      message: `Processed ${students.length} students: ${successCount} added, ${skippedCount} skipped, ${errorCount} failed`,
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