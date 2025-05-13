import { Request, Response, NextFunction } from "express";
import Institute from "../../models/instituteModel";
import { CustomError } from "../../middleware/error";
import { Admin } from "../../models/adminModel";

export const createInstitute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      logo,
      description,
      address,
      contactNumber,
      email,
      website,
      standards,
      subjects
    } = req.body;

    const adminIds = [req.user._id];

    // Create new institute
    const institute = await Institute.create({
      name,
      logo,
      description,
      address,
      contactNumber,
      email,
      website,
      admins: adminIds,
      batches: [],
      standards,
      subjects
    });

    // Update the admin's institute array by pushing the new institute ID
    await Admin.findByIdAndUpdate(
      req.user._id,
      { $push: { institutes: institute._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: institute
    });
    
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const updateInstitute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const institute = await Institute.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!institute) {
      return next(new CustomError('Institute not found', 404));
    }

    res.status(200).json({
      success: true,
      data: institute
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const getCurrentUserInstitutes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.user._id)
    // Find all institutes where the current user is an admin
    const institutes = await Institute.find({
      admins: { $in: [req.user._id] }
    }).sort({ createdAt: -1 });

    console.log(institutes, "here rae the insitues")
    res.status(200).json({
      success: true,
      count: institutes.length,
      institutes
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};