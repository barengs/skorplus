import React from 'react';

/**
 * Custom Branded Facility Badges for SkorPluss
 * Designed to mirror high-end commercial bimbel service emblems
 * (e.g. SP-CBT, SP-Consult, SP-Clinic, SP-Analytics, SP-Campus, SP-Class)
 */

export function IconSpConsult({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="consultBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="consultGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Emblem Graphic on Left */}
      <g transform="translate(12, 6)">
        {/* Yellow consultation arc */}
        <circle cx="28" cy="36" r="23" stroke="url(#consultGold)" strokeWidth="4.5" strokeDasharray="85 45" strokeLinecap="round" />
        <circle cx="48" cy="18" r="4.5" fill="url(#consultGold)" />

        {/* Navy Blue circular monogram badge */}
        <circle cx="28" cy="28" r="21" fill="url(#consultBlue)" />
        {/* Stylized S in white */}
        <path d="M22 20C22 17.5 24.5 15.5 28 15.5C31.5 15.5 34 17.5 34 20C34 23 25 24 25 27.5C25 30 27 31.5 30 31.5C33 31.5 35 30 35 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 35V36" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* Stacked Branded Typography on Right */}
      <g transform="translate(76, 12)">
        <text x="0" y="21" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="19" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="-0.5">
          SP-CON
        </text>
        <text x="0" y="40" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="19" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="1.2">
          SULT
        </text>
        {/* Golden Smile Arc Accent */}
        <path d="M0 46 Q 35 49 70 46" stroke="url(#consultGold)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function IconSpCbt({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="cbtOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="cbtBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Geometric Speed Arrow Badge */}
      <g transform="translate(10, 8)">
        <path
          d="M8 12C8 6 12 2 18 2H38L48 14L38 26H22V34H44L34 46H18C12 46 8 42 8 36V12Z"
          fill="url(#cbtOrange)"
        />
        <path
          d="M20 12H34L40 19L34 26H20C17 26 15 24 15 21V17C15 14 17 12 20 12Z"
          fill="url(#cbtBlue)"
        />
        <circle cx="24" cy="19" r="2.5" fill="#FDE68A" />
      </g>

      {/* Wordmark and Subtitle */}
      <g transform="translate(68, 11)">
        <text x="0" y="32" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="30" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="-1">
          sp-cbt
        </text>
        <text x="1" y="47" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="8" fill="#64748B" className="dark:fill-slate-400" letterSpacing="0.3">
          SkorPluss Adaptive CBT
        </text>
      </g>
    </svg>
  );
}

export function IconSpClinic({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="clinicBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="clinicSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Left Monogram SP with golden accent dots */}
      <g transform="translate(10, 8)">
        <circle cx="16" cy="4" r="3" fill="#F59E0B" />
        <circle cx="26" cy="2" r="3.5" fill="#F59E0B" />
        <circle cx="36" cy="5" r="2.5" fill="#FBBF24" />

        <rect x="6" y="10" width="38" height="38" rx="12" fill="url(#clinicBlue)" />
        <path d="M25 21V37M17 29H33" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <circle cx="25" cy="29" r="2" fill="#FDE68A" />
      </g>

      {/* Wordmark and Subtitle */}
      <g transform="translate(64, 11)">
        <text x="0" y="32" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="28" fill="url(#clinicSky)" letterSpacing="-0.5">
          Clinic
        </text>
        <circle cx="56" cy="15" r="3" fill="#F59E0B" />
        <text x="1" y="47" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="8" fill="#64748B" className="dark:fill-slate-400" letterSpacing="0.3">
          Klinik Akademik & Garansi
        </text>
      </g>
    </svg>
  );
}

export function IconSpAnalytics({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="analyticsBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="analyticsAmber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* Analytics Chart Badge */}
      <g transform="translate(10, 8)">
        <rect x="6" y="8" width="40" height="40" rx="12" fill="url(#analyticsBlue)" />
        <rect x="14" y="30" width="5" height="10" rx="1.5" fill="#93C5FD" />
        <rect x="22" y="24" width="5" height="16" rx="1.5" fill="#60A5FA" />
        <rect x="30" y="16" width="5" height="24" rx="1.5" fill="url(#analyticsAmber)" />
        <path d="M15 27L24 21L33 13L39 17" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="39" cy="17" r="2.5" fill="#F59E0B" />
      </g>

      {/* Wordmark and Subtitle */}
      <g transform="translate(66, 12)">
        <text x="0" y="30" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="23" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="-0.5">
          SP-Analytics
        </text>
        <text x="1" y="47" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="8" fill="#64748B" className="dark:fill-slate-400" letterSpacing="0.3">
          Diagnosis Skor & Probabilitas
        </text>
      </g>
    </svg>
  );
}

export function IconSpCampus({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="campusBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="campusGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Campus Compass Badge */}
      <g transform="translate(10, 8)">
        <circle cx="26" cy="28" r="21" fill="url(#campusBlue)" />
        <circle cx="26" cy="28" r="16" stroke="url(#campusGold)" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M26 15L31 28L26 41L21 28Z" fill="#FBBF24" />
        <path d="M26 15L31 28L26 28Z" fill="#F59E0B" />
        <circle cx="26" cy="28" r="3" fill="white" />
      </g>

      {/* Wordmark and Subtitle */}
      <g transform="translate(66, 12)">
        <text x="0" y="30" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="23" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="-0.5">
          SP-Campus
        </text>
        <text x="1" y="47" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="8" fill="#64748B" className="dark:fill-slate-400" letterSpacing="0.3">
          Rekomendasi Jurusan PTN
        </text>
      </g>
    </svg>
  );
}

export function IconSpClass({ className = 'h-16 w-auto' }) {
  return (
    <svg viewBox="0 0 210 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="classBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="classGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* Class Video / E-learning Badge */}
      <g transform="translate(10, 8)">
        <rect x="6" y="8" width="40" height="40" rx="12" fill="url(#classBlue)" />
        <path d="M22 19L35 28L22 37V19Z" fill="url(#classGold)" />
        <path d="M16 41C20 39 26 39 26 41C26 39 32 39 36 41" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Wordmark and Subtitle */}
      <g transform="translate(66, 12)">
        <text x="0" y="30" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="23" fill="#1E3A8A" className="dark:fill-blue-400" letterSpacing="-0.5">
          SP-Class
        </text>
        <text x="1" y="47" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="8" fill="#64748B" className="dark:fill-slate-400" letterSpacing="0.3">
          Video Modul & E-Learning
        </text>
      </g>
    </svg>
  );
}

/**
 * Renders the appropriate custom emblem based on feature data
 */
export default function FacilityCustomIcon({ feature, index = 0, className = 'h-16 sm:h-20 w-auto' }) {
  const icon = feature?.icon;
  const title = String(feature?.title || '').toLowerCase();

  // 1. If explicit image URL
  if (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('data:image/'))) {
    return (
      <img
        src={icon}
        alt={feature?.title || 'Fasilitas'}
        className={`${className} object-contain mx-auto`}
      />
    );
  }

  // 2. If raw SVG string
  if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
    return (
      <div
        className={`${className} flex items-center justify-center mx-auto`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  // 3. Match by facility title keywords or emoji
  if (title.includes('cbt') || title.includes('adaptif') || icon === '🧠') {
    return <IconSpCbt className={className} />;
  }
  if (title.includes('tutor') || title.includes('forum') || title.includes('consult') || title.includes('tanya') || icon === '💬') {
    return <IconSpConsult className={className} />;
  }
  if (title.includes('klinik') || title.includes('clinic') || title.includes('garansi') || title.includes('lolos') || icon === '🏅') {
    return <IconSpClinic className={className} />;
  }
  if (title.includes('analitik') || title.includes('progres') || title.includes('score') || icon === '📊') {
    return <IconSpAnalytics className={className} />;
  }
  if (title.includes('jurusan') || title.includes('ptn') || title.includes('kampus') || title.includes('campus') || icon === '🧭') {
    return <IconSpCampus className={className} />;
  }
  if (title.includes('video') || title.includes('modul') || title.includes('kurikulum') || title.includes('class') || icon === '🎬') {
    return <IconSpClass className={className} />;
  }

  // 4. Fallback by index so every card has a distinct custom badge
  const iconList = [
    IconSpCbt,
    IconSpConsult,
    IconSpClinic,
    IconSpAnalytics,
    IconSpCampus,
    IconSpClass,
  ];
  const Component = iconList[index % iconList.length];
  return <Component className={className} />;
}

