const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const cors = require("cors");
const json = require("body-parser").json;
const http = require("http");
require("dotenv").config();

const schema = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const { authMiddleware } = require("./middleware/auth");

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"]
          : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    })
  );

  const apolloServer = new ApolloServer({
    typeDefs: schema,
    resolvers,
    formatError: (error) => {
      console.error("GraphQL Error:", error);
      return {
        message: error.message,
        code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
      };
    },
    // context executes when any request comes to the server so it checks for the authintication
    context: async ({ req }) => {
      const { user } = await authMiddleware(req);
      return {
        user,
        req,
      };
    },
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const { user } = await authMiddleware(req);
        return {
          user,
          req,
        };
      },
    })
  );

  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "مرحباً بك في Mini Team Kanban Board API",
      version: "1.0.0",
      endpoints: {
        graphql: "/graphql",
        health: "/health",
      },
      documentation: "استخدم GraphQL Playground على /graphql للتفاعل مع API",
    });
  });

  const PORT = process.env.PORT || 4000;

  server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(
      `📊 GraphQL Playground متاح على: http://localhost:${PORT}/graphql`
    );
    console.log(`🏥 Health Check متاح على: http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error("خطأ في بدء الخادم:", error);
  process.exit(1);
});
