import { app } from "./app";
import ConnectToDB from "./db/db";
import serverless from "serverless-http";
// import { otpWorker } from "./services/bullmq/worker";


const port = process.env.PORT || 4001

ConnectToDB(); //main db

// otpWorker
const handler = serverless(app);
app.listen(port, () => console.log(`Server is working on port ${port}`))

export { handler };