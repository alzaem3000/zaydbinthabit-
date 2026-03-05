import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../../server/routes";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

let serverlessHandler: serverless.Handler;

export const handler = async (event: any, context: any) => {
    if (!serverlessHandler) {
        await registerRoutes(app);
        serverlessHandler = serverless(app);
    }
    return serverlessHandler(event, context);
};
