import { Request, Response, NextFunction } from "express";
import Batch from "../../models/batchModel";
import { CustomError } from "../../middleware/error";

// Create a new batch
export const createBatch = async ( 
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      standard,
      subjects,
      schedule,
      startDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!name || !standard || !subjects || !schedule || !startDate) {
      return next(new CustomError("Please provide all required fields", 400));
    }

    // Validate schedule format
    if (!schedule.days || !schedule.startTime || !schedule.endTime) {
      return next(new CustomError("Please provide complete schedule details", 400));
    }

    // Create new batch with mentor ID from authenticated user
    const batch = await Batch.create({
      name,
      standard,
      subjects,
      mentor: req.user._id, // Assuming mentor's ID is available in req.user after authentication
      schedule,
      startDate,
      endDate: endDate || null
    });

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: {
        batch,
        shareCode: batch.shareCode,
        shareLink: batch.shareLink
      }
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

// Get all batches for a mentor
export const getMentorBatches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const batches = await Batch.find({ mentor: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

// Get single batch details
export const getBatchDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const batch = await Batch.findById(req.params.id)

    if (!batch) {
      return next(new CustomError("Batch not found", 404));
    }

    // Check if the authenticated user is the mentor of this batch
    if (batch.mentor._id.toString() !== req.user._id.toString()) {
      return next(new CustomError("Not authorized to access this batch", 403));
    }

    res.status(200).json({
      success: true,
      data: batch
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

// Update batch details
export const updateBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return next(new CustomError("Batch not found", 404));
    }

    // Check if the authenticated user is the mentor of this batch
    if (batch.mentor.toString() !== req.user._id.toString()) {
      return next(new CustomError("Not authorized to update this batch", 403));
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      data: updatedBatch
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

// Delete batch
export const deleteBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return next(new CustomError("Batch not found", 404));
    }

    // Check if the authenticated user is the mentor of this batch
    if (batch.mentor.toString() !== req.user._id.toString()) {
      return next(new CustomError("Not authorized to delete this batch", 403));
    }

    await batch.deleteOne();

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully"
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

// Regenerate batch share code
export const regenerateShareCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return next(new CustomError("Batch not found", 404));
    }

    // Check if the authenticated user is the mentor of this batch
    if (batch.mentor.toString() !== req.user._id.toString()) {
      return next(new CustomError("Not authorized to regenerate share code", 403));
    }

    const { shareCode, shareLink } = await batch.regenerateShareCode();

    res.status(200).json({
      success: true,
      message: "Share code regenerated successfully",
      data: { shareCode, shareLink }
    });

  } catch (error: any) {
    next(new CustomError(error.message, 500));
  }
};

