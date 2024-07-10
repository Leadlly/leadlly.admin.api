import { Worker } from "bullmq";
import Redis from "ioredis";
import { config } from "dotenv";
import { sendMail } from "../../utils/sendMail";
config();

const redisUri = process.env.REDIS_URI as string;

const connection = new Redis(redisUri, { maxRetriesPerRequest: null });

export const otpWorker = new Worker(
  "otp-queue",
  async (job) => {
    await sendMail(job.data?.options);
  },
  { connection },
);
