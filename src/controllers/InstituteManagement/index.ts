import { Request, Response, NextFunction } from "express";
import Institute from "../../models/instituteModel";
import Batch from "../../models/batchModel";
import { CustomError } from "../../middleware/error";

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
      admins
    } = req.body;

    // Create new institute
    const institute = await Institute.create({
      name,
      logo,
      description,
      address,
      contactNumber,
      email,
      website,
      admins,
      batches: []
    });

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