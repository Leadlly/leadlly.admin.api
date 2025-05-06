import { app } from "./app";
import ConnectToDB from "./db/db";
import { logger } from "./utils/winstonLogger";


const port = process.env.PORT || 4002

ConnectToDB(); //main db

// otpWorker

app.listen(port, () => logger.info(`Server is running on port ${port}`));
