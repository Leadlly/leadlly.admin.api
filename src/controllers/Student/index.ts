import { Request, Response, NextFunction } from "express";
import { db } from "../../db/db";
import { CustomError } from "../../middleware/error";
import mongoose from "mongoose";


export const updateStudentMentor = async (req: Request, res: Response, next: NextFunction) => {
    console.log('updateStudentMentor function called');
    try {
        console.log('Received request:', req.params, req.body);

        const { studentId } = req.params;
        const { mentorId } = req.body; // Expect mentorId to be provided in the request body

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return next(new CustomError("Invalid student ID", 400));
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);

        // If mentorId is provided, validate it
        if (mentorId && !mongoose.Types.ObjectId.isValid(mentorId)) {
            return next(new CustomError("Invalid mentor ID", 400));
        }

        let updateResult;

        if (mentorId) {
            const mentorObjectId = new mongoose.Types.ObjectId(mentorId);

            const student = await db.collection('users').findOne({ _id: studentObjectId, "mentor._id": null });
            console.log('Student found:', student);

            if (!student) {
                return next(new CustomError("Student not found or already allocated to a mentor", 404));
            }

            updateResult = await db.collection('users').updateOne(
                { _id: studentObjectId },
                { $set: { mentor: { _id: mentorObjectId } } }
            );
            console.log('Update result:', updateResult);

            if (updateResult.modifiedCount === 0) {
                return next(new CustomError("Failed to allocate student to mentor", 500));
            }

            // Optionally, update the mentor's students list if it's an embedded document (depends on your schema)
            await db.collection('mentors').updateOne(
                { _id: mentorObjectId },
                { $addToSet: { students: { _id: studentObjectId } } }
            );

            res.status(200).json({
                success: true,
                message: "Student successfully allocated to mentor",
            });
        } else {
            // Deallocate the student from the mentor
            updateResult = await db.collection('users').updateOne(
                { _id: studentObjectId },
                { $set: { mentor: { _id: null } } }
            );

            console.log('Update result:', updateResult);

            if (updateResult.modifiedCount === 0) {
                return next(new CustomError("Failed to deallocate student from mentor", 500));
            }

            await db.collection('mentors').updateMany(
                { 'students._id': studentObjectId },
                { $pull: { students: { _id: studentObjectId } as any } }
            );

            res.status(200).json({
                success: true,
                message: "Student successfully deallocated from mentor",
            });
        }
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        next(new CustomError(error.message));
    }
};

export const getStudentsWithNullMentor = async (req: Request, res: Response, next: NextFunction) => {
    console.log('getStudentsWithNullMentor function called');
    try {
        // Fetch all students with a null mentor
        const students = await db.collection('users').find({ "mentor._id": null }).project({
            _id: 1,
            firstname: 1,
            lastname: 1,
            email: 1,
            academic: 1,
            mentor: 1
        }).toArray();

        console.log('Students with null mentor:', students);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No students found with null mentor"
            });
        }

        res.status(200).json({
            success: true,
            students: students
        });
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        next(new CustomError(error.message));
    }
};