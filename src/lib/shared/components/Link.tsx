import React from "react";
import { useRouter } from "../hooks/useRouter";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  prefetch = false,
  ...props
}) => {
  const { navigateTo } = useRouter();

  const isExternal = /^https?:\/\//.test(href);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!isExternal) {
      navigateTo(href);
    } else {
      // Open external links in a new tab
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  const handleMouseEnter = () => {
    if (prefetch && !isExternal) {
      // Prefetch using HEAD request to warm cache
      fetch(href, { method: "HEAD" }).catch(() => {});
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  );
};
