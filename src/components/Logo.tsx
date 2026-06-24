"use client";

type Props = {
  className?: string;
};

export default function Logo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 1986.6426 1890.4116"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <g transform="translate(439.08984,1668.4824)">
        <path d="m -242.87305,-1668.4824 -196.21679,339.8574 H 1351.3359 l 196.2168,-339.8574 z" />
        <path d="M 652.33974,-117.92823 456.12303,221.9292 -439.08984,-1328.625 l 196.21675,-339.8574 z" />
        <path d="M 259.9082,-1668.4824 903.73047,-553.34766 1099.9453,-893.20508 652.33984,-1668.4824 Z" />
      </g>
    </svg>
  );
}
