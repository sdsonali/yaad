export type PersonRole = "papa" | "mummy" | "sister" | "self" | "karan" | "neha" | "rohit" | "friend";
export type PersonDraw = { role: PersonRole; x: number; h: number };

const ROLE: Record<PersonRole, { skin: string; hair: string; shirt: string; style: string }> = {
  papa: { skin: "#e2b48a", hair: "#8d8680", shirt: "#f4ecdc", style: "papa" },
  mummy: { skin: "#e6ba8e", hair: "#2a211c", shirt: "#f6d3bf", style: "bun" },
  sister: { skin: "#f0c49a", hair: "#2a211c", shirt: "#f0c43a", style: "pony" },
  self: { skin: "#e8bc90", hair: "#241c16", shirt: "#2f5fbf", style: "short" },
  karan: { skin: "#c98958", hair: "#1a1614", shirt: "#2f8f5b", style: "beard" },
  neha: { skin: "#e8bc90", hair: "#1a1614", shirt: "#d4538a", style: "long" },
  rohit: { skin: "#d7a574", hair: "#3a2a22", shirt: "#e07a2f", style: "cap" },
  friend: { skin: "#c98958", hair: "#33302c", shirt: "#6b7280", style: "short" },
};

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function person(p: PersonDraw): string {
  const look = ROLE[p.role];
  const foot = 470;
  const headR = p.h < 190 ? p.h * 0.2 : p.h * 0.15;
  const headCy = foot - p.h + headR + 6;
  const bodyTop = headCy + headR * 0.85;
  const bodyW = p.h * 0.36;
  const bodyH = Math.max(20, foot - bodyTop);
  const x = p.x;
  const hair =
    look.style === "bun"
      ? `<circle cx="${x}" cy="${headCy - headR * 0.85}" r="${headR * 0.55}" fill="${look.hair}"/>`
      : look.style === "pony"
        ? `<circle cx="${x + headR * 0.9}" cy="${headCy - headR * 0.2}" r="${headR * 0.48}" fill="${look.hair}"/>`
        : look.style === "long"
          ? `<path d="M${x - headR} ${headCy} Q${x - headR - 8} ${headCy + 70} ${x - headR + 6} ${headCy + 90} L${x + headR - 6} ${headCy + 90} Q${x + headR + 8} ${headCy + 70} ${x + headR} ${headCy}" fill="${look.hair}"/>`
          : look.style === "cap"
            ? `<path d="M${x - headR} ${headCy - 4} h${headR * 2} v${headR * 0.45} h${-headR * 2.4} z" fill="${look.shirt}"/>`
            : `<ellipse cx="${x}" cy="${headCy - headR * 0.55}" rx="${headR * 0.95}" ry="${headR * 0.55}" fill="${look.hair}"/>`;
  const moustache = look.style === "papa" ? `<ellipse cx="${x}" cy="${headCy + headR * 0.28}" rx="${headR * 0.55}" ry="4" fill="#4a4038"/>` : "";
  const beard = look.style === "beard" ? `<path d="M${x - headR * 0.7} ${headCy + 4} Q${x} ${headCy + headR * 1.15} ${x + headR * 0.7} ${headCy + 4}" fill="${look.hair}"/>` : "";
  const sari = p.role === "mummy" ? `<path d="M${x - bodyW * 0.7} ${bodyTop + 10} L${x + bodyW * 0.85} ${bodyTop + 16} L${x + bodyW * 0.55} ${foot} L${x - bodyW * 0.85} ${foot} Z" fill="#9c2748"/>` : "";
  return `
    <g>
      ${sari}
      <rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bodyH}" rx="12" fill="${p.role === "mummy" ? "#f6d3bf" : look.shirt}"/>
      <circle cx="${x}" cy="${headCy}" r="${headR}" fill="${look.skin}"/>
      ${hair}
      ${beard}
      ${moustache}
      <circle cx="${x - headR * 0.32}" cy="${headCy - 1}" r="2.2" fill="#2b211c"/>
      <circle cx="${x + headR * 0.32}" cy="${headCy - 1}" r="2.2" fill="#2b211c"/>
    </g>`;
}

function peopleSvg(people: PersonDraw[]): string {
  return people.map(person).join("");
}

function scanFrame(): string {
  return `<rect x="14" y="14" width="372" height="492" fill="none" stroke="#efe6d4" stroke-width="16"/>
    <rect x="22" y="22" width="356" height="476" fill="none" stroke="#c3b296" stroke-width="2"/>`;
}

function shell(bg: string, inner: string, scan = false): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
  <rect width="400" height="520" fill="${scan ? "#cbbfa8" : bg}"/>
  ${inner}
  ${scan ? scanFrame() : ""}
</svg>`;
}

function cake(color: string, age: number): string {
  const light = color === "#2563eb" ? "#93c5fd" : "#fff";
  return `
    <ellipse cx="200" cy="392" rx="92" ry="22" fill="#00000022"/>
    <rect x="124" y="330" width="152" height="62" rx="10" fill="${color}"/>
    <rect x="136" y="312" width="128" height="28" rx="8" fill="${light}"/>
    <rect x="194" y="286" width="6" height="30" fill="#f8fafc"/>
    <rect x="214" y="290" width="6" height="26" fill="#f8fafc"/>
    <circle cx="197" cy="284" r="5" fill="#f59e0b"/>
    <circle cx="217" cy="288" r="5" fill="#f59e0b"/>
    <text x="200" y="368" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="700" fill="#fff">${age}</text>`;
}

export type Scene =
  | { kind: "memory"; motif: string; scan?: boolean; people: PersonDraw[]; cake?: string; age?: number; seed?: number; banner?: string }
  | { kind: "paper"; variant: string; kicker: string; lines: string[] }
  | { kind: "phone"; variant: string; lines: string[] }
  | { kind: "object"; variant: "pills" | "bottle" | "thermo" };

function memory(scene: Extract<Scene, { kind: "memory" }>): string {
  const seed = scene.seed ?? 0;
  const shift = (seed % 5) * 6;
  let bg = "#f3e6d4";
  let extra = "";
  switch (scene.motif) {
    case "birthday":
      bg = scene.scan ? "#d9c7a4" : "#f6e7cf";
      extra = `<circle cx="${70 + shift}" cy="90" r="22" fill="#e11d48"/><circle cx="${330 - shift}" cy="110" r="18" fill="#2563eb"/><circle cx="40" cy="150" r="12" fill="#f59e0b"/>
        <rect x="70" y="400" width="260" height="16" rx="4" fill="#a16207"/>`;
      break;
    case "school":
      bg = "#d5dbe3";
      extra = `<rect x="70" y="150" width="260" height="200" fill="#f8fafc" stroke="#94a3b8"/>
        <polygon points="60,150 200,70 340,150" fill="#b45309"/>
        <rect x="185" y="40" width="8" height="40" fill="#334155"/>
        <rect x="150" y="250" width="100" height="100" fill="#cbd5e1"/>
        <text x="200" y="200" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#1e293b">SCHOOL</text>`;
      break;
    case "diwali":
      bg = scene.scan ? "#8a6a45" : "#1c2140";
      extra = `<ellipse cx="200" cy="430" rx="70" ry="16" fill="${scene.scan ? "#c2410c" : "#fb7185"}" opacity="0.8"/>
        ${[80, 140, 200, 260, 320].map((x) => `<ellipse cx="${x}" cy="400" rx="16" ry="8" fill="#fbbf24"/><rect x="${x - 2}" y="378" width="4" height="18" fill="#f59e0b"/>`).join("")}
        <text x="200" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="${scene.scan ? "#3f2e22" : "#fde68a"}">दिवाली</text>`;
      break;
    case "holi":
      bg = "#f8f5ef";
      extra = `<circle cx="80" cy="120" r="48" fill="#ef4444" opacity="0.85"/><circle cx="300" cy="100" r="56" fill="#3b82f6" opacity="0.8"/>
        <circle cx="200" cy="180" r="36" fill="#22c55e" opacity="0.75"/><circle cx="120" cy="240" r="28" fill="#eab308" opacity="0.8"/>`;
      break;
    case "shimla":
      bg = "#dbeafe";
      extra = `<polygon points="0,300 80,180 150,260 220,140 310,250 400,190 400,520 0,520" fill="#64748b"/>
        <polygon points="180,140 220,140 200,100" fill="#f8fafc"/><polygon points="40,190 90,190 70,150" fill="#f8fafc"/>`;
      break;
    case "jaipur":
      bg = "#f6d0c4";
      extra = `<rect x="90" y="160" width="220" height="230" fill="#e7a598"/>
        <path d="M150 250 Q200 180 250 250" fill="#f8d7ce"/>
        <rect x="170" y="250" width="60" height="140" fill="#7f1d1d"/>
        <text x="200" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#7f1d1d">JAIPUR</text>`;
      break;
    case "park":
      bg = "#d9f0d4";
      extra = `<ellipse cx="200" cy="470" rx="180" ry="30" fill="#4ade80"/>
        <rect x="70" y="250" width="16" height="120" fill="#92400e"/><circle cx="78" cy="220" r="46" fill="#15803d"/>`;
      break;
    case "home":
      bg = "#f3e6d0";
      extra = `<rect x="60" y="180" width="280" height="200" fill="#f8f1e3" stroke="#d6c4a8"/>
        <rect x="90" y="220" width="70" height="70" fill="#bfdbfe"/><rect x="230" y="250" width="70" height="130" fill="#d6b48c"/>`;
      break;
    case "rain":
      bg = "#cbd5e1";
      extra = Array.from({ length: 12 }, (_, i) => `<line x1="${30 + i * 30}" y1="40" x2="${18 + i * 30}" y2="90" stroke="#64748b" stroke-width="3"/>`).join("");
      break;
    case "papa_function":
      bg = "#3f2a1d";
      extra = `<path d="M20 70 Q40 110 60 70 Q80 110 100 70 Q120 110 140 70 Q160 110 180 70 Q200 110 220 70 Q240 110 260 70 Q280 110 300 70 Q320 110 340 70 Q360 110 380 70" fill="none" stroke="#f59e0b" stroke-width="8"/>
        ${[70, 140, 200, 260, 330].map((x) => `<ellipse cx="${x}" cy="430" rx="14" ry="7" fill="#fbbf24"/>`).join("")}`;
      break;
    case "papa_news":
      bg = "#efe6d8";
      extra = `<rect x="90" y="300" width="220" height="120" rx="16" fill="#a16207"/><rect x="120" y="250" width="90" height="70" fill="#f8fafc" stroke="#94a3b8"/>`;
      break;
    case "papa_office":
      bg = "#e2e8f0";
      extra = `<rect x="70" y="280" width="260" height="18" fill="#334155"/><rect x="150" y="210" width="100" height="70" rx="6" fill="#0f172a"/><rect x="158" y="218" width="84" height="48" fill="#38bdf8"/>`;
      break;
    case "papa_park":
      bg = "#dcfce7";
      extra = `<ellipse cx="200" cy="480" rx="190" ry="28" fill="#22c55e"/><circle cx="300" cy="180" r="50" fill="#fbbf24"/>`;
      break;
    case "papa_cook":
      bg = "#fff7ed";
      extra = `<rect x="80" y="300" width="240" height="16" fill="#44403c"/><ellipse cx="160" cy="300" rx="36" ry="14" fill="#9ca3af"/><ellipse cx="250" cy="292" rx="28" ry="16" fill="#ef4444"/>`;
      break;
    case "papa_car":
      bg = "#dbe4ee";
      extra = `<rect x="40" y="180" width="320" height="180" rx="20" fill="#94a3b8"/><circle cx="200" cy="300" r="48" fill="#1e293b" stroke="#e2e8f0" stroke-width="8"/>`;
      break;
    case "papa_balcony":
      bg = "#e0f2fe";
      extra = `<line x1="40" y1="360" x2="360" y2="360" stroke="#334155" stroke-width="8"/>
        <line x1="40" y1="400" x2="360" y2="400" stroke="#334155" stroke-width="8"/>
        <rect x="250" y="320" width="28" height="36" rx="6" fill="#f8fafc" stroke="#94a3b8"/>`;
      break;
    case "papa_family":
      bg = "#f8e7c9";
      extra = `<rect x="40" y="150" width="320" height="180" fill="#fdba74" opacity="0.35"/>`;
      break;
    case "papa_friends":
      bg = "#e7e5e4";
      extra = `<rect x="30" y="80" width="340" height="120" fill="#44403c"/><text x="200" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#fafaf9">FAMILY MEET</text>`;
      break;
    case "college_fest":
      bg = "#312e81";
      extra = `<rect x="50" y="250" width="300" height="20" fill="#f59e0b"/>
        <circle cx="80" cy="120" r="10" fill="#f43f5e"/><circle cx="200" cy="80" r="10" fill="#facc15"/><circle cx="320" cy="120" r="10" fill="#22d3ee"/>
        <text x="200" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#fff">FEST</text>`;
      break;
    case "farewell":
      bg = "#4c1d95";
      extra = `<rect x="36" y="150" width="328" height="64" rx="8" fill="#f5f3ff"/>
        <text x="200" y="192" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#4c1d95">FAREWELL</text>`;
      break;
    case "hostel":
      bg = "#e7e5e4";
      extra = `<rect x="60" y="160" width="120" height="200" fill="#d6d3d1" stroke="#78716c"/><rect x="220" y="160" width="120" height="200" fill="#d6d3d1" stroke="#78716c"/>
        <text x="200" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#44403c">HOSTEL</text>`;
      break;
    case "canteen":
      bg = "#fff7ed";
      extra = `<rect x="50" y="300" width="300" height="18" fill="#9a3412"/>
        <ellipse cx="120" cy="290" rx="28" ry="10" fill="#fff"/><ellipse cx="200" cy="286" rx="28" ry="10" fill="#fff"/><ellipse cx="280" cy="290" rx="28" ry="10" fill="#fff"/>
        <text x="200" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#9a3412">CANTEEN</text>`;
      break;
    case "hangout":
      bg = "#ecfccb";
      extra = `<rect x="80" y="280" width="240" height="14" fill="#65a30d"/><circle cx="140" cy="268" r="16" fill="#ef4444"/><circle cx="250" cy="266" r="16" fill="#facc15"/>`;
      break;
    case "beach":
      bg = "#7dd3fc";
      extra = `<rect x="0" y="300" width="400" height="220" fill="#fde68a"/><rect x="0" y="250" width="400" height="70" fill="#0284c7"/>
        <circle cx="${300 - shift}" cy="90" r="36" fill="#facc15"/>`;
      break;
    case "sunset":
      bg = "#fb923c";
      extra = `<circle cx="200" cy="280" r="70" fill="#fde68a"/><rect x="0" y="300" width="400" height="220" fill="#0369a1"/>`;
      break;
    case "food":
      bg = "#fff7ed";
      extra = `<ellipse cx="200" cy="300" rx="110" ry="36" fill="#fff" stroke="#d6d3d1" stroke-width="6"/>
        <ellipse cx="200" cy="292" rx="70" ry="22" fill="#ef4444"/><circle cx="250" cy="250" r="22" fill="#facc15"/>`;
      break;
    case "cafe_blue":
      bg = "#f5e6c8";
      extra = `<rect x="70" y="150" width="260" height="250" fill="#f8f1e3" stroke="#d6c4a8" stroke-width="4"/>
        <rect x="155" y="230" width="90" height="170" fill="#1d4ed8"/>
        <circle cx="226" cy="320" r="5" fill="#fde68a"/>
        ${[90, 130, 180, 230, 280, 320].map((x) => `<circle cx="${x}" cy="130" r="6" fill="#facc15"/>`).join("")}
        <text x="200" y="200" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#44403c">CAFE</text>`;
      break;
    case "cafe_roof":
      bg = "#bae6fd";
      extra = `<rect x="40" y="220" width="40" height="140" fill="#64748b"/><rect x="100" y="180" width="50" height="180" fill="#334155"/>
        <rect x="180" y="140" width="36" height="220" fill="#475569"/><rect x="240" y="200" width="70" height="160" fill="#1e293b"/>
        <rect x="60" y="300" width="280" height="12" fill="#44403c"/>
        <text x="200" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#0f172a">ROOFTOP CAFE</text>`;
      break;
    case "cafe_shack":
      bg = "#fde68a";
      extra = `<rect x="0" y="300" width="400" height="80" fill="#38bdf8"/>
        <polygon points="70,260 200,140 330,260" fill="#a16207"/>
        <rect x="110" y="260" width="180" height="120" fill="#f5e6c8"/>
        <text x="200" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#44403c">SHACK</text>`;
      break;
    case "office":
      bg = "#e2e8f0";
      extra = `<rect x="60" y="200" width="280" height="150" fill="#fff" stroke="#94a3b8"/>
        <rect x="80" y="230" width="100" height="70" fill="#0ea5e9"/><rect x="200" y="250" width="110" height="16" fill="#cbd5e1"/>
        <text x="200" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#334155">OFFICE</text>`;
      break;
    case "new_house":
      bg = "#fff7ed";
      extra = `<rect x="40" y="80" width="320" height="200" fill="#e0f2fe" stroke="#fff" stroke-width="8"/>
        <rect x="70" y="330" width="180" height="70" rx="12" fill="#fb923c"/>
        ${[80, 140, 200, 260, 320].map((x) => `<circle cx="${x}" cy="70" r="5" fill="#facc15"/>`).join("")}
        <ellipse cx="300" cy="400" rx="18" ry="8" fill="#fbbf24"/>
        <text x="200" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#9a3412">NEW HOUSE</text>`;
      break;
    case "outing":
      bg = "#d9f99d";
      extra = `<circle cx="90" cy="300" r="28" fill="#111"/><circle cx="210" cy="300" r="28" fill="#111"/>
        <path d="M70 250 H230 L250 210 H120 Z" fill="#f97316"/>
        <circle cx="320" cy="160" r="40" fill="#22c55e"/>`;
      break;
    default:
      extra = "";
  }
  const banner = scene.banner
    ? `<text x="200" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#1e1a16">${esc(scene.banner)}</text>`
    : "";
  const cakeSvg = scene.cake && scene.age ? cake(scene.cake, scene.age) : "";
  return shell(bg, `${extra}${peopleSvg(scene.people)}${cakeSvg}${banner}`, Boolean(scene.scan));
}

function paper(scene: Extract<Scene, { kind: "paper" }>): string {
  const body = scene.lines
    .map((line, i) => {
      const size = i === 0 ? 30 : i === 1 ? 18 : 16;
      const weight = i === 0 ? 700 : 500;
      return `<text x="200" y="${88 + i * 42}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" font-weight="${weight}" fill="#1e1a16">${esc(line)}</text>`;
    })
    .join("");
  const seal = `<circle cx="310" cy="430" r="36" fill="none" stroke="#b45309" stroke-width="4"/><circle cx="310" cy="430" r="26" fill="none" stroke="#b45309" stroke-width="2"/>`;
  return shell(
    "#efe6d4",
    `<rect x="28" y="24" width="344" height="472" fill="#fffdf8" stroke="#b08968" stroke-width="3"/>
     <text x="200" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#78716c">${esc(scene.kicker)}</text>
     ${body}${seal}`,
  );
}

function phone(scene: Extract<Scene, { kind: "phone" }>): string {
  const body = scene.lines
    .map((line, i) => `<text x="200" y="${150 + i * 36}" text-anchor="middle" font-family="Georgia, serif" font-size="${i === 0 ? 20 : 15}" fill="#0f172a">${esc(line)}</text>`)
    .join("");
  const chat = scene.variant === "chat"
    ? `<rect x="78" y="160" width="180" height="36" rx="12" fill="#bbf7d0"/><rect x="140" y="210" width="170" height="36" rx="12" fill="#e2e8f0"/>`
    : "";
  return shell(
    "#e7e5e4",
    `<rect x="78" y="36" width="244" height="448" rx="28" fill="#111827"/>
     <rect x="92" y="70" width="216" height="380" rx="8" fill="${scene.variant === "chat" ? "#ecfdf5" : "#f8fafc"}"/>
     <rect x="168" y="48" width="64" height="10" rx="5" fill="#334155"/>
     ${chat}${body}`,
  );
}

function object(scene: Extract<Scene, { kind: "object" }>): string {
  if (scene.variant === "pills") {
    const cells = Array.from({ length: 10 }, (_, i) => {
      const x = 70 + (i % 5) * 54;
      const y = 180 + Math.floor(i / 5) * 70;
      return `<rect x="${x}" y="${y}" width="42" height="52" rx="16" fill="${i === 3 ? "#e5e7eb" : "#f8fafc"}" stroke="#94a3b8"/>`;
    }).join("");
    return shell("#f8fafc", `<rect x="48" y="150" width="304" height="180" rx="18" fill="#dbe3ea" stroke="#64748b" stroke-width="3"/>${cells}
      <text x="200" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#0f172a">PARACETAMOL 500</text>
      <text x="200" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#64748b">medicine strip</text>`);
  }
  if (scene.variant === "bottle") {
    return shell("#f8fafc", `<rect x="160" y="90" width="80" height="36" rx="6" fill="#94a3b8"/>
      <rect x="130" y="126" width="140" height="250" rx="24" fill="#bfdbfe" stroke="#0369a1" stroke-width="4"/>
      <text x="200" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#0f172a">VITAMIN</text>
      <text x="200" y="260" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#0f172a">BOTTLE</text>`);
  }
  return shell("#f8fafc", `<rect x="184" y="70" width="32" height="340" rx="16" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
    <rect x="190" y="220" width="20" height="160" rx="8" fill="#ef4444"/>
    <circle cx="200" cy="60" r="22" fill="#fecaca" stroke="#ef4444" stroke-width="3"/>
    <text x="200" y="460" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#0f172a">THERMOMETER</text>`);
}

export function renderScene(scene: Scene): string {
  if (scene.kind === "memory") return memory(scene);
  if (scene.kind === "paper") return paper(scene);
  if (scene.kind === "phone") return phone(scene);
  return object(scene);
}

export function family(child = true): PersonDraw[] {
  return [
    { role: "mummy", x: 120, h: 230 },
    { role: "self", x: 200, h: child ? 150 : 210 },
    { role: "sister", x: 280, h: child ? 140 : 190 },
  ];
}

export function papaSolo(): PersonDraw[] {
  return [{ role: "papa", x: 200, h: 320 }];
}

export function papaFamily(): PersonDraw[] {
  return [
    { role: "papa", x: 90, h: 250 },
    { role: "mummy", x: 170, h: 230 },
    { role: "self", x: 250, h: 160 },
    { role: "sister", x: 320, h: 150 },
  ];
}

export function papaFriends(): PersonDraw[] {
  return [
    { role: "friend", x: 70, h: 210 },
    { role: "karan", x: 140, h: 220 },
    { role: "papa", x: 210, h: 250 },
    { role: "rohit", x: 280, h: 220 },
    { role: "friend", x: 345, h: 200 },
  ];
}

export function collegeGroup(): PersonDraw[] {
  return [
    { role: "karan", x: 80, h: 220 },
    { role: "self", x: 155, h: 230 },
    { role: "neha", x: 235, h: 215 },
    { role: "rohit", x: 320, h: 225 },
  ];
}
