import { app } from "./app";

import { otpWorker } from "./services/bullmq/worker";


const port = process.env.PORT || 4001


otpWorker
app.listen(port, () => console.log(`Server is working on port ${port}`))