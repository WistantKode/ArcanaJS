import React from "react";
import { Link } from "./Link";
import { useRouter } from "../hooks/useRouter";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  exact?: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  activeClassName = "active",
  className = "",
  exact = false,
  children,
  ...props
}) => {
  const { currentUrl } = useRouter();

  const isActive = exact ? currentUrl === href : currentUrl.startsWith(href);

  const combinedClassName = `${className} ${
    isActive ? activeClassName : ""
  }`.trim();

  return (
    <Link href={href} className={combinedClassName} {...props}>
      {children}
    </Link>
  );
};
