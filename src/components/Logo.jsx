// src/components/Logo.jsx

const Logo = ({ className = "w-12 h-12" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        fill="none"
        className={className} // Permet de changer la taille avec Tailwind
    >
        {/* Fond carré arrondi */}
        <rect width="128" height="128" rx="24" fill="#1E1E2E" />

        {/* Les blocs ascendants (du plus foncé au plus clair) */}
        <path d="M40 88H56V104H40V88Z" fill="#89B4FA" fillOpacity="0.6" />
        <path d="M60 68H76V84H60V68Z" fill="#89B4FA" fillOpacity="0.8" />
        {/* Le bloc de tête, le plus lumineux */}
        <path d="M80 48H96V64H80V48Z" fill="#89B4FA" />

        {/* Ligne de progression subtile */}
        <path d="M40 104L96 48" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
    </svg>
);

export default Logo;