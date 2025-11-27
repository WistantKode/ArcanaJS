declare var __non_webpack_require__: NodeJS.Require;

// Global CSS files
declare module "*.css";

// CSS Modules
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
