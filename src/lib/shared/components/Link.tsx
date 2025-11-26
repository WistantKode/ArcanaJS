import React from "react";
import { useRouter } from "../hooks/useRouter";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
  const { navigateTo } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateTo(href);
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
