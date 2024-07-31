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



  
