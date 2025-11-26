import { NextFunction, Request, Response } from "express";

export const createDynamicRouter = (views: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Remove leading slash
    let path = req.path.substring(1);

    // Handle root path mapping to "index" if not handled elsewhere
    if (path === "") {
      path = "index";
    }

    // 1. Exact match
    if (views[path]) {
      return res.renderPage(path, {});
    }

    // 2. Dynamic match
    for (const viewName of Object.keys(views)) {
      if (!viewName.includes("[")) continue;

      // Convert view path to regex
      // e.g., "users/[id]" -> "^users/([^/]+)$"
      // We need to escape special regex characters first, but keep [ and ] for our logic
      // Actually, simpler: split by '/' and match segments

      const pageParts = viewName.split("/");
      const pathParts = path.split("/");

      if (pageParts.length !== pathParts.length) continue;

      let match = true;
      const params: Record<string, string> = {};

      for (let i = 0; i < pageParts.length; i++) {
        const pagePart = pageParts[i];
        const pathPart = pathParts[i];

        if (pagePart.startsWith("[") && pagePart.endsWith("]")) {
          const paramName = pagePart.slice(1, -1);
          params[paramName] = pathPart;
        } else if (pagePart !== pathPart) {
          match = false;
          break;
        }
      }

      if (match) {
        return res.renderPage(viewName, {}, params);
      }
    }

    // If not found, pass to the next middleware (usually 404 handler)
    next();
  };
};
