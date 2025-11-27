import { ArcanaJSServer } from "arcanajs/server";
import webRoutes from "./routes/web";

const PORT = process.env.PORT || 3000;

const server = new ArcanaJSServer({
  port: PORT,
  routes: webRoutes,
});

server.start();
