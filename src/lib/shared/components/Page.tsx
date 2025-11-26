import React from "react";
import { PageContext } from "../context/PageContext";
import { Head } from "./Head";

export const Page: React.FC<{
  data?: any;
  title?: string;
  children: React.ReactNode;
}> = ({ data, title, children }) => {
  return (
    <PageContext.Provider value={data}>
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}
      {children}
    </PageContext.Provider>
  );
};
