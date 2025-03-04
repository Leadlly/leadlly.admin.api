import  jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import User from "../../models/userModel";
import { CustomError } from "../../middleware/error";
import setCookie from "../../utils/setCookies";
import crypto from "crypto";
import { sendMail } from "../../utils/sendMail";

const hashPassword = (password: string, salt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const newUser = new User({
      firstname,
      email,
      salt,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' } // Token valid for 1 hour
    );

    // Send response with token
    res.status(201).json({
      message: 'User registered successfully',
      token, // Return the token to the client
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).select('+password +salt');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!, // Ensure your JWT secret is available in environment variables
      { expiresIn: '1h' } // Token valid for 1 hour
    );

    // Optionally set the token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      maxAge: 3600000, // 1 hour
    });

    // Send response with token
    res.status(200).json({
      message: 'Logged in successfully',
      token, // Return the token to the client
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
    // await otpQueue.add("otpVerify", {
    //   options: {
    //     email: email,
    //     subject: "Password Reset",
    //     message: `You reset password link is here ${url}`,
    //   },
    // });

    await sendMail({
      email,
      subject: "Password Reset",
      message: url,
      tag: 'password_reset'
    })

     setCookie({
      user,
      res,
      next,
      message: "Login Success",
      statusCode: 200,
    });

    res.status(200).json({
      success: true,
      message: `Reset password link sent to ${email}`,
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params as { token: string };
  const { password } = req.body;

    try {
      if (!token) {
        throw new Error("Reset token is required");
      }
  
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  
      console.log('Reset Password Token:', resetPasswordToken);
  
      const user = await User.findOne({
        resetPasswordToken,
        resetTokenExpiry: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      }
  
      const hashedPassword = await new Promise<string>((resolve, reject) => {
        crypto.pbkdf2(
          password,
          user.salt,
          1000,
          64,
          'sha512',
          (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex'));
          }
        );
      });
  
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetTokenExpiry = null;
  
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error: any) {
    console.log(error);
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