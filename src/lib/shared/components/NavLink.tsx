import React from "react";
import { useRouter } from "../hooks/useRouter";
import { Link } from "./Link";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  exact?: boolean;
  prefetch?: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  activeClassName = "active",
  className = "",
  exact = false,
  prefetch = false,
  children,
  ...props
}) => {
  const { currentUrl } = useRouter();

  const isActive = exact ? currentUrl === href : currentUrl.startsWith(href);

  const combinedClassName = `${className} ${
    isActive ? activeClassName : ""
  }`.trim();

  return (
    <Link
      href={href}
      className={combinedClassName}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  );
};
