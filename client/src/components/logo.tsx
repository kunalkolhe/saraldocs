interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="url(#logoGradient)" />
      
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      
      <path
        d="M10 12C10 10.8954 10.8954 10 12 10H22L28 16V28C28 29.1046 27.1046 30 26 30H12C10.8954 30 10 29.1046 10 28V12Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M22 10V16H28"
        fill="white"
        fillOpacity="0.7"
      />
      <path
        d="M22 10L28 16H22V10Z"
        fill="#E0E7FF"
      />
      
      <path
        d="M13 17H25"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      <path
        d="M13 20.5H23"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      
      <circle cx="30" cy="26" r="8" fill="#10B981" />
      <path
        d="M27 26L29 28L33 24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <text
        x="19"
        y="28"
        fontSize="7"
        fontWeight="bold"
        fill="#3B82F6"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        अ
      </text>
    </svg>
  );
}
