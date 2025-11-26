import { useState, useEffect } from "react";

export const useDynamicComponents = (loader: () => Promise<any>) => {
  const [component, setComponent] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    loader().then((mod) => {
      if (mounted) {
        setComponent(mod.default || mod);
      }
    });
    return () => {
      mounted = false;
    };
  }, []); // loader dependency omitted to avoid loops if loader is inline

  return component;
};
