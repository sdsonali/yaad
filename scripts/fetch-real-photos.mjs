import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoDir = path.join(root, "public", "photos");

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=55`;

const pools = {
  bluecake: [img("photo-1562440499-64c9a111f713"), img("photo-1464349153735-7db50ed83c84")],
  bluedoor: [img("photo-1533104816931-20fa691ff6ca"), img("photo-1555881400-74d7acaacd8b"), img("photo-1524231757912-21f4fe3a7200")],
  father: [
    img("photo-1566492031773-4f4e44671857"),
    img("photo-1472099645785-5658abf4ff4e"),
    img("photo-1547425260-76bcadfb4f2c"),
    img("photo-1552058544-f2b08422138a"),
    img("photo-1500648767791-00dcc994a43e"),
    img("photo-1507003211169-0a1dd7228f2d"),
    img("photo-1506794778202-cad84cf45f1d"),
  ],
  medicine: [
    img("photo-1584308666744-24d5c474f2ae"),
    img("photo-1471864190281-a93a3070b6de"),
    img("photo-1587854692152-cbe660dbde88"),
    img("photo-1550572017-edd951b55104"),
    img("photo-1573883430697-4c3479aae6b9"),
    img("photo-1585435557343-3b092031a831"),
  ],
  diwalihome: [img("photo-1605379399642-870262d3d051"), img("photo-1574267432553-4b4628081c31"), img("photo-1603228254119-e6a4d4797e4c")],
  farewell: [img("photo-1523050854058-8df90110c9f1"), img("photo-1541339907198-e08756dedf3f"), img("photo-1627556704290-2b1f5853ff78")],
  birthday: [
    img("photo-1530103862676-de8c9debad1d"),
    img("photo-1464349095431-e9a21285b5c3"),
    img("photo-1578985545062-69928b1d9587"),
    img("photo-1558636508-e0b0d0c0e0d1"),
    img("photo-1464349153735-7db50ed83c84"),
    img("photo-1513151233558-d860c5398176"),
    img("photo-1531956531700-dc0ee0f1f9a5"),
    img("photo-1486427944299-d1955d23e34d"),
    img("photo-1563729784474-d77dbb933a9e"),
    img("photo-1602631985686-1bb0e6a8696e"),
  ],
  school: [
    img("photo-1503676260728-1c00da094a0b"),
    img("photo-1580582932707-520aed937b7b"),
    img("photo-1427504494785-3a9ca7044f45"),
    img("photo-1509062522246-3755977927d7"),
    img("photo-1497633762265-9d179a990aa6"),
    img("photo-1577896851231-70ef18881754"),
  ],
  diwali: [
    img("photo-1574269909862-7e1d70bb8078"),
    img("photo-1604605801370-3396f9bd9ba0"),
    img("photo-1632931612792-f0199ab44b5e"),
    img("photo-1605379399642-870262d3d051"),
    img("photo-1574267432553-4b4628081c31"),
  ],
  holi: [
    img("photo-1615824996195-f780bba7cfab"),
    img("photo-1583266999030-6c0b0b0b0b0b"),
    img("photo-1524492412937-b28074a5d7da"),
    img("photo-1496024840928-4c417adf211d"),
  ],
  trip: [
    img("photo-1506905925346-21bda4d32df4"),
    img("photo-1464822759023-fed622ff2c3b"),
    img("photo-1626621341517-bbf3d9990a23"),
    img("photo-1477587458883-47145ed94245"),
    img("photo-1599661046289-e31897846e41"),
    img("photo-1486870591958-9b9d0d1dda99"),
  ],
  family: [
    img("photo-1609220136736-443140cffec6"),
    img("photo-1511895426328-dc8714191300"),
    img("photo-1478131143081-80f7f84ca84d"),
    img("photo-1581579438747-1dc8d17bbce4"),
    img("photo-1511895426328-dc8714191300"),
    img("photo-1609220136736-443140cffec6"),
  ],
  friends: [
    img("photo-1529156069898-49953e39b3ac"),
    img("photo-1529333166437-7750a6dd5a70"),
    img("photo-1517486808906-6ca8b3f04846"),
    img("photo-1523580494863-6f3031224c94"),
    img("photo-1543807535-eceef0bc6599"),
    img("photo-1522202176988-66273c2fd55f"),
  ],
  college: [
    img("photo-1523050854058-8df90110c9f1"),
    img("photo-1541339907198-e08756dedf3f"),
    img("photo-1523580494863-6f3031224c94"),
    img("photo-1529156069898-49953e39b3ac"),
    img("photo-1517486808906-6ca8b3f04846"),
    img("photo-1529333166437-7750a6dd5a70"),
    img("photo-1541339907198-e08756dedf3f"),
    img("photo-1523240795612-9a054b0db644"),
  ],
  document: [
    img("photo-1450101499163-c8848c66ca85"),
    img("photo-1586281380349-632531db7ed4"),
    img("photo-1568667256549-094345857637"),
    img("photo-1554224155-6726b3ff858f"),
    img("photo-1454165804606-c3d57bc86b40"),
    img("photo-1434030216411-0b793f4b4173"),
    img("photo-1586281380117-5a60ae2050cc"),
  ],
  screenshot: [
    img("photo-1512941937669-90a1b58e7e9c"),
    img("photo-1551650975-87deedd944c3"),
    img("photo-1511707171634-5f897ff02aa9"),
    img("photo-1601784551446-20c9e07cdbdb"),
    img("photo-1510557880182-3d4d3cba35a5"),
    img("photo-1611162616475-46b635cb6868"),
  ],
  beach: [
    img("photo-1512343879784-a960bf40e7f2"),
    img("photo-1507525428034-b723cf961d3e"),
    img("photo-1473496169904-658ba7c44d8a"),
    img("photo-1506953823976-52e1fdc0149a"),
    img("photo-1473116763249-2cb7ed2977c7"),
    img("photo-1519046904884-53103b34b206"),
    img("photo-1500375592092-40eb2168fd21"),
  ],
  cafe: [
    img("photo-1554118811-1e0d58224f24"),
    img("photo-1495474472287-4d71bcdd2085"),
    img("photo-1445116572660-236099ec2aeb"),
    img("photo-1559925393-8be0ec4767c8"),
    img("photo-1501339847302-ac426a4a7cbb"),
    img("photo-1554118811-1e0d58224f24"),
  ],
  food: [
    img("photo-1504674900247-0877df9cc836"),
    img("photo-1476224203421-9ac39bcb3327"),
    img("photo-1414235077428-338989a2e8c0"),
    img("photo-1493770348161-36956023f973"),
    img("photo-1473093295043-cdd812d0e601"),
  ],
  office: [
    img("photo-1497366216548-37526070297c"),
    img("photo-1497366811353-6870744d04b2"),
    img("photo-1521737711867-e3b97375f902"),
    img("photo-1497215728101-856f4ea42174"),
  ],
  outing: [
    img("photo-1469474968028-56623f02e42e"),
    img("photo-1500530855697-b586d89ba3ee"),
    img("photo-1470770841072-f978cf4d019e"),
    img("photo-1441974231531-c6227db76b6e"),
    img("photo-1501785888041-af3ef285b470"),
    img("photo-1472214103451-9374bd1c798e"),
  ],
};

function bucket(photo) {
  const note = `${photo.sensory_notes ?? ""} ${photo.caption_en}`;
  if (photo.type === "document") return "document";
  if (photo.type === "screenshot") return "screenshot";
  if (photo.type === "object" || photo.occasion === "medical") return "medicine";
  if (photo.place === "goa" && /blue door/i.test(note)) return "bluedoor";
  if (photo.place === "goa" && (photo.occasion === "cafe" || /caf[eé]/i.test(note))) return "cafe";
  if (photo.place === "goa" && (photo.occasion === "food" || /food/i.test(note))) return "food";
  if (photo.place === "goa") return "beach";
  if (photo.people?.includes("papa") && photo.composition === "solo") return "father";
  if (photo.people?.includes("papa") && photo.people?.includes("friends")) return "friends";
  if (photo.people?.includes("papa")) return "family";
  if (photo.occasion === "birthday") return "birthday";
  if (photo.occasion === "school_event") return "school";
  if (photo.occasion === "diwali") return "diwali";
  if (photo.occasion === "holi") return "holi";
  if (photo.occasion === "trip") return "trip";
  if (photo.occasion === "farewell") return "farewell";
  if (["college_fest", "hostel", "canteen"].includes(photo.occasion)) return "college";
  if (photo.user_age >= 18 && photo.user_age <= 22 && photo.type === "memory") return "college";
  if (/office/i.test(note)) return "office";
  return "outing";
}

async function pull(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "image/avif,image/webp,image/*,*/*" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(String(response.status));
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 8000) throw new Error("too small");
  return bytes;
}

const photos = JSON.parse(await readFile(path.join(root, "data", "photos.json"), "utf8"));
const catalog = JSON.parse(await readFile(path.join(root, "data", "catalog.public.json"), "utf8"));
const cursor = {};
let stock = 0;
let fallback = 0;

for (const photo of photos) {
  const key = bucket(photo);
  const list = pools[key] ?? pools.outing;
  cursor[key] = cursor[key] ?? 0;
  const start = cursor[key];
  cursor[key] += 1;
  let bytes = null;
  for (let attempt = 0; attempt < list.length; attempt += 1) {
    const url = list[(start + attempt) % list.length];
    try {
      bytes = await pull(url);
      stock += 1;
      break;
    } catch {
      /* try the next photograph in this group */
    }
  }
  if (!bytes) {
    bytes = await pull(`https://picsum.photos/seed/yaad-${photo.id}/900/1200`);
    fallback += 1;
  }
  await writeFile(path.join(photoDir, `${photo.id}.jpg`), bytes);
  photo.file = `/photos/${photo.id}.jpg`;
  process.stdout.write(`\r${photo.id} ${key}   `);
}

const files = new Map(photos.map((photo) => [photo.id, photo.file]));
for (const item of catalog) item.file = files.get(item.id) ?? item.file.replace(/\.svg$/, ".jpg");
await writeFile(path.join(root, "data", "photos.json"), JSON.stringify(photos, null, 2));
await writeFile(path.join(root, "data", "catalog.public.json"), JSON.stringify(catalog, null, 2));
console.log(`\nSaved ${photos.length} photographs. Stock ${stock}, fallback ${fallback}.`);
