import React, { useEffect, useState } from "react";
import { Page } from "./components/Page";
import { RouterProvider } from "./context/RouterContext";

export interface ArcanaJSAppProps {
  initialPage: string;
  initialData: any;
  initialUrl?: string;
  views: Record<string, React.FC<any>>;
  layout?: React.FC<{ children: React.ReactNode }>;
}

export const ArcanaJSApp: React.FC<ArcanaJSAppProps> = ({
  initialPage,
  initialData,
  initialUrl,
  views,
  layout: Layout,
}) => {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(initialData);
  const [url, setUrl] = useState(
    initialUrl ||
      (typeof window !== "undefined" ? window.location.pathname : "/")
  );

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setPage(event.state.page);
        setData(event.state.data);
        setUrl(window.location.pathname);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = async (newUrl: string) => {
    try {
      const response = await fetch(newUrl, {
        headers: { "x-arcanajs-request": "true" },
      });
      const json = await response.json();

      setPage(json.page);
      setData(json.data);
      setUrl(newUrl);

      window.history.pushState(
        { page: json.page, data: json.data },
        "",
        newUrl
      );
    } catch (error) {
      console.error("Navigation failed", error);
    }
  };

  const renderPage = () => {
    const Component =
      views[page] || views["NotFoundPage"] || (() => <div>404 Not Found</div>);
    return (
      <Page data={data}>
        {/* @ts-ignore */}
        <Component data={data} navigateTo={navigateTo} />
      </Page>
    );
  };

  const content = renderPage();

  return (
    <RouterProvider
      value={{ navigateTo, currentPage: page, currentUrl: url, params: {} }}
    >
      {Layout ? <Layout>{content}</Layout> : <>{content}</>}
    </RouterProvider>
  );
};
