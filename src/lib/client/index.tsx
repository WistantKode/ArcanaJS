import React from "react";
import { hydrateRoot } from "react-dom/client";
import { HeadContext, HeadManager } from "../shared/context/HeadContext";
import { ArcanaJSApp } from "../shared/core/ArcanaJSApp";
import ErrorPage from "../shared/views/ErrorPage";
import NotFoundPage from "../shared/views/NotFoundPage";

export const hydrateArcanaJS = (
  viewsOrContext: Record<string, React.FC<any>> | any,
  layout?: React.FC<any>,
) => {
  let views: Record<string, React.FC<any>> = {};

  if (viewsOrContext.keys && typeof viewsOrContext.keys === "function") {
    viewsOrContext.keys().forEach((key: string) => {
      const viewName = key.replace(/^\.\/(.*)\.tsx$/, "$1");
      views[viewName] = viewsOrContext(key).default;
    });
  } else {
    views = viewsOrContext;
  }

  // Add default error views if not present
  if (!views["NotFoundPage"]) {
    views["NotFoundPage"] = NotFoundPage;
  }
  if (!views["ErrorPage"]) {
    views["ErrorPage"] = ErrorPage;
  }

  const container = document.getElementById("root");
  const dataScript = document.getElementById("__ArcanaJS_DATA__");

  // Client-side HeadManager (noop for push, as Head handles client updates via useEffect)
  const headManager: HeadManager = {
    tags: [],
    push: () => {},
  };

  if (container && dataScript) {
    try {
      const { page, data, params, csrfToken } = JSON.parse(
        dataScript.textContent || "{}",
      );
      hydrateRoot(
        container,
        <HeadContext.Provider value={headManager}>
          <ArcanaJSApp
            initialPage={page}
            initialData={data}
            initialParams={params}
            csrfToken={csrfToken}
            views={views}
            layout={layout}
          />
        </HeadContext.Provider>,
      );
    } catch (e) {
      console.error("Failed to parse initial data", e);
    }
  }
};
