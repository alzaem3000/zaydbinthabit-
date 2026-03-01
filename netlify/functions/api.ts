import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let serverlessHandler: serverless.Handler;

export const handler = async (event: any, context: any) => {
    if (!serverlessHandler) {
        await registerRoutes(app);
        serverlessHandler = serverless(app);
    }
    return serverlessHandler(event, context);
};
