import type { SVGProps } from "react";
import { LastRevLogo } from "./last-rev-logo";

type LastRevAppsLogoProps = SVGProps<SVGSVGElement> & {
  tagClassName?: string;
};

export function LastRevAppsLogo({
  className,
  tagClassName,
  ...props
}: LastRevAppsLogoProps) {
  return (
    <span className="relative inline-flex items-center">
      <LastRevLogo className={className} {...props} />
      <span
        className={
          "absolute -top-1.5 -right-3 rounded-full bg-accent px-1.5 py-[1px] text-[9px] font-bold uppercase leading-none tracking-wider text-black " +
          (tagClassName ?? "")
        }
      >
        Apps
      </span>
    </span>
  );
}
