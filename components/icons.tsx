// Icônes SVG légères (aucune dépendance externe)
import React from 'react';

type P = { size?: number } & React.SVGProps<SVGSVGElement>;
const S = ({ children, ...p }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const IconHome = (p: P) => <S {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></S>;
export const IconClients = (p: P) => <S {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.6 3.2-6 6.5-6s6 2.4 6.5 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16.5 14.2c2.7.3 4.6 2.4 5 5.3" /></S>;
export const IconOrders = (p: P) => <S {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2.8h6V4" /><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" /></S>;
export const IconInvoice = (p: P) => <S {...p}><path d="M6 2h9l4 4v16H6z" /><path d="M15 2v4h4" /><path d="M13.5 11.5a3 3 0 1 0 0 5M9 13h4M9 15h4" /></S>;
export const IconStock = (p: P) => <S {...p}><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></S>;
export const IconGear = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></S>;
export const IconImage = (p: P) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="M21 16l-5-5-9 9" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" /></S>;
export const IconUsers = IconClients;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconSave = (p: P) => <S {...p}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></S>;
export const IconUndo = (p: P) => <S {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></S>;
export const IconTrash = (p: P) => <S {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" /></S>;
export const IconPrint = (p: P) => <S {...p}><path d="M6 9V2h12v7" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v8H6z" /></S>;
export const IconCalendar = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" /></S>;
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const IconBolt = (p: P) => <S {...p} fill="currentColor" stroke="none"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></S>;
export const IconChevron = (p: P) => <S {...p}><path d="M9 6l6 6-6 6" /></S>;
export const IconLogout = (p: P) => <S {...p}><path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" /></S>;
export const IconPhone = (p: P) => <S {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></S>;
export const IconMail = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></S>;
export const IconPin = (p: P) => <S {...p}><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></S>;
export const IconNote = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></S>;
export const IconList = (p: P) => <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></S>;
export const IconMenu = (p: P) => <S {...p}><path d="M3 6h18M3 12h18M3 18h18" /></S>;
export const IconKey = (p: P) => <S {...p}><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M17 6l3 3M15 8l2 2" /></S>;
export const IconArrows = (p: P) => <S {...p}><path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4" /></S>;
export const IconDb = (p: P) => <S {...p}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></S>;
