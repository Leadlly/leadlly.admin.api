import { Request, Response, NextFunction } from "express";
import User from "../../models/userModel";
import { CustomError } from "../../middleware/error";
import setCookie from "../../utils/setCookies";
import generateOTP from "../../utils/generateOTP";
import { otpQueue } from "../../services/bullmq/producer";
import crypto from "crypto";
import { db } from "../../db/db";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) return next(new CustomError("User already exists", 400));

    const OTP = generateOTP();

    await otpQueue.add("otpVerify", {
      options: {
        email,
        subject: "Verification",
        message: `Your verification OTP for registration is ${OTP}`,
      },
    });
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(
      password,
      salt,
      1000,
      64,
      "sha512",
      async (err, derivedKey) => {
    const nameArray = name.split(" ");
    const newUser = {
      firstname: nameArray[0],
      lastname: nameArray.length > 1 ? nameArray.slice(1).join(' ') : null,
      email,
      password: derivedKey.toString("hex"),
      salt
    };


    // Save OTP and newUser data in the OTP collection
    const hashedOTP = crypto.createHash('sha256').update(OTP).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existingOtpRecord = await db.collection("otps").findOne({ email });
    if (existingOtpRecord) {
      await db.collection("otps").updateOne(
        { email },
        {
          $set: {
            otp: hashedOTP,
            expiresAt,
            newUser,
          },
        }
      );
    } else {
      await db.collection("otps").insertOne({
        email,
        otp: hashedOTP,
        expiresAt,
        newUser,
      });
    }
  })
    res.status(200)
      .cookie('email', email)
      .json({
        success: true,
        message: `Verification OTP sent to ${email}`,
      });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const resentOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("inside resent otp")
  try {
    const { email } = req.body;
    console.log(email)

    const otpRecord = await db.collection("otps").findOne({ email });
    if (!otpRecord) return next(new CustomError("User not found", 404));

    const OTP = generateOTP();

    await otpQueue.add("otpVerify", {
      options: {
        email,
        subject: "Verification",
        message: `Your verification OTP for registration is ${OTP}`,
      },
    });

    const hashedOTP = crypto.createHash('sha256').update(OTP).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
    await db.collection("otps").updateOne(
      { email },
      {
        $set: {
          otp: hashedOTP,
          expiresAt,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `OTP resent successfully to ${email}`,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const otpVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { otp, email } = req.body;

    const otpRecord = await db.collection("otps").findOne({ email });
    if (!otpRecord) return next(new CustomError("OTP not found", 404));

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== otpRecord.otp || otpRecord.expiresAt < new Date(Date.now())) {
      return next(new CustomError("Invalid or expired OTP", 400));
    }

    const newUser = otpRecord.newUser;
    const user = await User.create(newUser);
    await db.collection("otps").deleteOne({ email });

    setCookie({
      user,
      res,
      next,
      message: "Verification Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new CustomError("Email not registered", 404));

    const isMatched = await user.comparePassword(password);
    if (!isMatched) return next(new CustomError("Wrong password", 400));

    setCookie({
      user,
      res,
      next,
      message: "Login Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new CustomError("Email not registered", 400));

    const resetToken = await user.getToken();

    await user.save(); //saving the token in user

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    await otpQueue.add("otpVerify", {
      options: {
        email: email,
        subject: "Password Reset",
        message: `You reset password link is here ${url}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Reset password link sent to ${email}`,
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};

export const resetpassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const resetToken = req.params.token;
    if (!resetToken) return next(new CustomError("Something went wrong", 400));

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetTokenExpiry: {
        $gt: Date.now(),
      },
    });

    if (!user)
      return next(new CustomError("Your link is expired! Try again", 400));

    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetTokenExpiry = null;

    await user.save();
    res.status(200).json({
      success: true,
      message: "You password has been changed",
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged out",
    });
};

export const getUser = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return next(new CustomError("User not found", 400));

    res.status(200).json({
      success: true,
      user
    });

  } catch (error: any) {
    next(new CustomError(error.message));
  }
};
