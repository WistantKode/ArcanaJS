import { useContext } from "react";
import { HeadContext } from "../context/HeadContext";

export const useHead = () => useContext(HeadContext);
