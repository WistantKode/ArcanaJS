export const configFiles = [
  { src: "package.json", dest: "package.json" },
  { src: "tsconfig.json", dest: "tsconfig.json" },
  { src: "arcanajs.d.ts", dest: "src/arcanajs.d.ts" },
  { src: "postcss.config.js", dest: "postcss.config.js" },
  { src: "globals.css", dest: "src/client/globals.css" },
  { src: "client-index.tsx", dest: "src/client/index.tsx" },
  { src: "server-index.ts", dest: "src/server/index.ts" },
  { src: "server-routes-web.ts", dest: "src/server/routes/web.ts" },
  {
    src: "server-controller-home.ts",
    dest: "src/server/controllers/HomeController.ts",
  },
  {
    src: "HomePage.tsx",
    dest: "src/views/HomePage.tsx",
  },
  {
    src: "arcanajs.png",
    dest: "public/arcanajs.png",
  },
  {
    src: "arcanajs.svg",
    dest: "public/arcanajs.svg",
  },
  {
    src: "favicon.ico",
    dest: "public/favicon.ico",
  },
];

export const errorPages = ["NotFoundPage.tsx", "ErrorPage.tsx"];

export const requiredDirs = [
  "public",
  "src",
  "src/client",
  "src/server",
  "src/server/routes",
  "src/server/controllers",
  "src/views",
];
