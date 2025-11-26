import { ArcanaJSServer } from "arcanajs/server";
import webRoutes from "./routes/web";

const server = new ArcanaJSServer({
  routes: webRoutes,
});

const PORT = process.env.PORT || 3000;

server.start();
