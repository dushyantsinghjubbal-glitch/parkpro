import * as React from 'react';

export const ParkProLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 18V7h6a4 4 0 0 1 0 8H9" />
    <path d="M12 11v4" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>
);
