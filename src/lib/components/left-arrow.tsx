import * as React from "react";

interface Props {
    className?: string;
}

export const LeftArrow = ({ className }: Props ) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 1024 1024"
    fill="white"
  >
    <path
      id="SVGRepo_iconCarrier"
      d="M768 903.232 717.568 960 256 512 717.568 64 768 120.768 364.928 512z"
    ></path>
  </svg>
);
