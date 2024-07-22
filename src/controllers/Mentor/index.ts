import { Request, Response, NextFunction } from "express";
import { db } from "../../db/db";
import { CustomError } from "../../middleware/error";
import mongoose from "mongoose";

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
  
      const updatedStatus = mentor.status === 'Verified' ? 'Not Verified' : 'Verified';
      await db.collection('mentors').updateOne({ _id: new Object(mentorId) }, { $set: { status: updatedStatus } });
  
      res.status(200).json({
        success: true,
        message: `Mentor ${updatedStatus}`
      });
  
    } catch (error: any) {
      next(new CustomError(error.message));
    }
  };