import React from "react";
import { createSingletonContext } from "../utils/createSingletonContext";

export interface HeadManager {
  tags: React.ReactNode[];
  push: (tags: React.ReactNode) => void;
}

export const HeadContext = createSingletonContext<HeadManager | null>(
  "HeadContext",
  null
);
