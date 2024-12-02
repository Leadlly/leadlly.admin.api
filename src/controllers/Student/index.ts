import { Request, Response, NextFunction } from "express";
import { db } from "../../db/db";
import { CustomError } from "../../middleware/error";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await db.collection('users').find().toArray();

    if (!students || students.length === 0) {
      return next(new CustomError("No students found", 404));
    }

    res.status(200).json({
      success: true,
      students
    });

  } catch (error: any) {
    next(new CustomError(error.message));
  }
};
export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // id will come from the route params

    // Validate if ID is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return next(new CustomError("Invalid ID format", 400));
    }

    const student = await db.collection('users').findOne({ _id: new ObjectId(id) });

    if (!student) {
      return next(new CustomError("Student not found", 404));
    }

    res.status(200).json({
      success: true,
      student,
    });

  } catch (error: any) {
    next(new CustomError(error.message));
  }
};
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
    const { mentorId, query } = req.query as { mentorId?: string; query?: string };

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID is required",
      });
    }

    const objectId = new mongoose.Types.ObjectId(mentorId);

    // Fetch mentor details to determine gender
    const mentor = await db.collection("mentors").findOne(
      { _id: objectId },
      { projection: { "about.gender": 1 } }
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    const mentorGender = mentor.about?.gender; // Mentor's gender from `about`

    // Base filter for students with null mentor
    let filter: any = { "mentor._id": null };

    // Apply query filter if provided
    if (query) {
      const exactMatchFilter = {
        $or: [
          { firstname: query },
          { lastname: query },
          { email: query },
        ],
      };

      const exactMatches = await db.collection("users").find({
        ...filter,
        $or: [exactMatchFilter],
      })
        .project({
          _id: 1,
          firstname: 1,
          lastname: 1,
          email: 1,
          academic: 1,
          mentor: 1,
          "about.gender": 1,
        })
        .toArray();

      if (exactMatches.length > 0) {
        return res.status(200).json({
          success: true,
          students: exactMatches.sort((a: any, b: any) =>
            a.about?.gender === mentorGender ? -1 : b.about?.gender === mentorGender ? 1 : 0
          ),
        });
      }

      filter = {
        ...filter,
        $or: [
          { firstname: { $regex: query, $options: "i" } },
          { lastname: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      };
    }

    // Fetch students with null mentor
    const students = await db.collection("users")
      .find(filter)
      .project({
        _id: 1,
        firstname: 1,
        lastname: 1,
        email: 1,
        academic: 1,
        mentor: 1,
        "about.gender": 1,
      })
      .toArray();

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found with null mentor",
      });
    }

    // Sort students based on mentor's gender
    const sortedStudents = students.sort((a: any, b: any) =>
      a.about?.gender === mentorGender ? -1 : b.about?.gender === mentorGender ? 1 : 0
    );

    res.status(200).json({
      success: true,
      students: sortedStudents,
    });
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    next(new CustomError(error.message));
  }
};


  