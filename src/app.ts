import express, { urlencoded } from 'express';
import { config } from 'dotenv';
import serverless from 'serverless-http';
import expressWinston from 'express-winston';
import winston from 'winston';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorMiddleware from './middleware/error';
import authRoutes from './routes/auth'
import googleRoutes from './routes/googleAuth'
import mentorRoutes from './routes/mentorRoutes'
import studentRoutes from './routes/studentRoutes'
import instituteRoutes from './routes/instituteRoutes';


config({
    path: './.env'
});

const app = express();

app.use(
	expressWinston.logger({
		transports: [new winston.transports.Console()],
		format: winston.format.combine(winston.format.colorize(), winston.format.cli()),
		meta: true,
		expressFormat: true,
		colorize: true,
	})
);

app.use(cookieParser())
app.use(express.json())
app.use(urlencoded({extended: true}))
app.use(
  cors({
    origin: [process.env.FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

//routes
app.use('/api/auth/admin', authRoutes)
app.use("/api/google", googleRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/student", studentRoutes);
app.use('/api/institutes', instituteRoutes);

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


app.use(errorMiddleware);

// Wrapping express app with serverless-http
const handler = serverless(app);

export { app, handler };
