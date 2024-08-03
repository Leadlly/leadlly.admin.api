import { Request, Response, NextFunction } from "express";
import { db } from "../../db/db";
import { CustomError } from "../../middleware/error";
import mongoose from "mongoose";


export const allocateStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mentorId } = req.params;
        const { studentIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(mentorId)) {
            return next(new CustomError("Invalid mentor ID", 400));
        }

        const mentorObjectId = new mongoose.Types.ObjectId(mentorId);

        if (!Array.isArray(studentIds) || studentIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            return next(new CustomError("Invalid student IDs", 400));
        }

        const studentIdArray = studentIds.map(id => new mongoose.Types.ObjectId(id));

        for (const studentObjectId of studentIdArray) {
            const student = await db.collection('users').findOne({ _id: studentObjectId, "mentor._id": null });

            if (!student) {
                return next(new CustomError(`Student with ID ${studentObjectId} not found or already allocated to a mentor`, 404));
            }

            const updateResult = await db.collection('users').updateOne(
                { _id: studentObjectId },
                { $set: { mentor: { _id: mentorObjectId } } }
            );

            if (updateResult.modifiedCount === 0) {
                return next(new CustomError(`Failed to allocate student with ID ${studentObjectId} to mentor`, 500));
            }

            await db.collection('mentors').updateOne(
                { _id: mentorObjectId },
                { $addToSet: { students: { _id: studentObjectId } } }
            );
        }

        res.status(200).json({
            success: true,
            message: "Students successfully allocated to mentor",
        });
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        next(new CustomError(error.message));
    }
};

export const deallocateStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentIds } = req.body;

        // Validate input
        if (!Array.isArray(studentIds) || studentIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            return next(new CustomError("Invalid student IDs", 400));
        }

        const studentIdArray = studentIds.map(id => new mongoose.Types.ObjectId(id));

        for (const studentObjectId of studentIdArray) {
            // Deallocate the student
            const updateResult = await db.collection('users').updateOne(
                { _id: studentObjectId },
                { $set: { mentor: { _id: null } } }
            );

            if (updateResult.modifiedCount === 0) {
                console.error(`Failed to update student with ID ${studentObjectId}`);
                return next(new CustomError(`Failed to deallocate student with ID ${studentObjectId}`, 500));
            }

            // Remove the student from mentor's student list
            const mentorUpdateResult = await db.collection('mentors').updateMany(
                { 'students._id': studentObjectId },
                { $pull: { students: { _id: studentObjectId } as any } }
            );

            if (mentorUpdateResult.modifiedCount === 0) {
                console.error(`Failed to remove student with ID ${studentObjectId} from any mentor`);
                return next(new CustomError(`Failed to remove student with ID ${studentObjectId} from mentor`, 500));
            }
        }

        res.status(200).json({
            success: true,
            message: "Students successfully deallocated from mentor",
        });
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        next(new CustomError(error.message));
    }
};

export const getStudentsWithNullMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query as { query?: string };
      
      let filter: any = { "mentor._id": null };
      
      if (query) {
        // Exact match filter
        const exactMatchFilter = {
          $or: [
            { firstname: query },
            { lastname: query },
            { email: query },
          ],
        };
  
        // Search for exact matches first
        const exactMatches = await db.collection('users').find({
          ...filter,
          $or: [
            exactMatchFilter
          ]
        }).project({
          _id: 1,
          firstname: 1,
          lastname: 1,
          email: 1,
          academic: 1,
          mentor: 1,
        }).toArray();
  
        if (exactMatches.length > 0) {
          return res.status(200).json({
            success: true,
            students: exactMatches,
          });
        }
  
        // If no exact matches, search for partial matches
        filter = {
          ...filter,
          $or: [
            { firstname: { $regex: query, $options: 'i' } },
            { lastname: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        };
      }
  
      const students = await db.collection('users').find(filter).project({
        _id: 1,
        firstname: 1,
        lastname: 1,
        email: 1,
        academic: 1,
        mentor: 1,
      }).toArray();
  
      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No students found with null mentor",
        });
      }
  
      res.status(200).json({
        success: true,
        students: students,
      });
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      next(new CustomError(error.message));
    }
  };
  