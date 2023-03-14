import "reflect-metadata"
import express, { Request, Response } from 'express'
import * as path from "path"
import { loadSchemaSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import * as fs from "fs"
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema'
import { GraphQLSchema } from "graphql"
import { ApolloServer } from '@apollo/server'
import http from "http"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { expressMiddleware } from "@apollo/server/express4"
import { json } from 'body-parser';
import sanitizedConfig from "./config"
import { redis } from "./redis"
import session from "express-session"
let RedisStore = require("connect-redis")(session)
import cors from "cors"
import { redisSessionPrefix } from "./constants"
import helmet from "helmet"
import passport from "passport"
import { Strategy } from "passport-google-oauth20"
import { verifyCallback } from "./Restful routes/verifyCallback"

import rateLimit from 'express-rate-limit'
import rateLimitRedisStore from "rate-limit-redis";
import { AppDataSource } from "./data-source"

const morgan = require("morgan")

export const startServer = async () => {
    const schemas: GraphQLSchema[] = []
    const folders = fs.readdirSync(path.join(__dirname, "./modules"));

    folders.forEach(folder => {
        const { resolvers } = require(`./modules/${folder}/resolvers`)
        const typeDefs = loadSchemaSync(path.join(__dirname, `./modules/${folder}/typedefs/*.graphql`), { loaders: [new GraphQLFileLoader()] })

        schemas.push(makeExecutableSchema({
            typeDefs,
            resolvers
        }))
    })

    const schema = mergeSchemas({ schemas })
    const app = express();
    const httpServer = http.createServer(app);
    await AppDataSource.initialize()


    const config = {
        CLIENT_ID: sanitizedConfig.CLIENT_ID,
        SECRET_CLIENT: sanitizedConfig.SECRET_CLIENT
    }

    //SERVER STARTRUP
    const server = new ApolloServer({
        includeStacktraceInErrorResponses: false,
        schema,
        plugins:
            [
                ApolloServerPluginDrainHttpServer({ httpServer })
            ]
    });

    await server.start()

    app.set("trust proxy", true)
    //EXPRESS MIDDLEWARE
    app.use(
        session({
            store: new RedisStore({
                client: redis, prefix: redisSessionPrefix
            }),
            name: sanitizedConfig.SESSION_NAME,
            secret: sanitizedConfig.SECRET_CLIENT,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: false,
                //secure: sanitizedConfig.NODE_ENV === "production",
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
                sameSite: "none"
            }
        })
    );


    //PASSPORT CONFIG FOR GOOGLE AUTH
    app.use(passport.initialize())

    const AUTH_OPTIONS = {
        callbackURL: 'http://localhost:5000/auth/google/callback',
        clientID: config.CLIENT_ID,
        clientSecret: config.SECRET_CLIENT
    }

    passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

    app.get("/auth/google",
        passport.authenticate("google", {
            scope: ["email", "profile"]
        })
    );

    app.get("/auth/google/callback", passport.authenticate("google", {
        session: false
    }), (req: Request, res: Response) => {
        (req.session as any).userId = (req.user as any).id;
        // @todo redirect to frontend
        res.redirect("http://localhost:3001");
        console.log("Google called us back")
    })


    // app.use(express.static("public"))
    // app.use("*", express.static("public"))
    app.use(helmet());
    app.use(morgan('combined'))

    app.use("",
        cors<cors.CorsRequest>({
            credentials: true,
            origin: "http://localhost:3000",
        }),
        json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({ redis, req: req, session: req.session, url: req.protocol + "://" + req.get("host") })
        })
    );

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers

        store: new rateLimitRedisStore({
            // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
            sendCommand: (...args: string[]) => redis.call(...args),
        }),
    })

    app.use(limiter);

    await new Promise<void>((resolve) => httpServer.listen({ port: sanitizedConfig.PORT }, resolve))
    console.log(`🚀 Server ready at http://localhost:4000/`);
}


