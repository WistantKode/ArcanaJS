import { useContext } from "react";
import { PageContext } from "../context/PageContext";

export const usePage = <T = any>() => useContext(PageContext) as T;
