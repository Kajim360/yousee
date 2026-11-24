import "server-only";
import { db } from "@/db";
import {
  initiatives,
  cities,
  areas,
  evidenceSources,
  knowledgeDocs,
  opportunities,
  contributions,
  consentRecords,
  proposals,
  users,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { CONSENT_VERSION } from "./domain";
import { publicCoordinate } from "./privacy";
import { hashPassword } from "./password";
import { bootstrapAdminCredentials } from "./admin-config";

const AREA_NOTE =
  "Approximate centroid hand-placed for the MVP. NOT an official boundary. Replace with BIG/BPS administrative boundary GeoJSON before analytical use.";

// Approximate kecamatan centroids for Bandar Lampung (20 kecamatan).
const KECAMATAN: [string, number, number][] = [
  ["Teluk Betung Selatan", -5.45, 105.265],
  ["Teluk Betung Utara", -5.43, 105.255],
  ["Teluk Betung Timur", -5.465, 105.25],
  ["Teluk Betung Barat", -5.455, 105.23],
  ["Bumi Waras", -5.455, 105.28],
  ["Panjang", -5.47, 105.315],
  ["Enggal", -5.42, 105.265],
  ["Tanjung Karang Pusat", -5.415, 105.255],
  ["Tanjung Karang Timur", -5.42, 105.28],
  ["Tanjung Karang Barat", -5.41, 105.235],
  ["Kedamaian", -5.415, 105.295],
  ["Kedaton", -5.395, 105.26],
  ["Labuhan Ratu", -5.38, 105.255],
  ["Rajabasa", -5.37, 105.235],
  ["Langkapura", -5.39, 105.23],
  ["Kemiling", -5.4, 105.205],
  ["Way Halim", -5.39, 105.285],
  ["Sukarame", -5.38, 105.305],
  ["Sukabumi", -5.4, 105.32],
  ["Tanjung Senang", -5.36, 105.275],
];

const TODAY = "2026-01";

const SOURCES = [
  {
    slug: "bmkg",
    name: "BMKG — Weather, climate & early warning",
    publisher: "Badan Meteorologi, Klimatologi, dan Geofisika",
    url: "https://www.bmkg.go.id",
    sourceType: "official",
    description:
      "National agency publishing weather forecasts, extreme-weather early warnings, rainfall and climate information, and earthquake/tsunami information for Indonesia, including Lampung province.",
    coverage: "Indonesia (national, provincial and some city-level forecasts)",
    spatialResolution: "Varies by product (station, regency/city, province)",
    license: "Public information; check BMKG terms before redistribution. Not scraped by YouSee.",
    limitations:
      "YouSee links to BMKG but does not yet ingest live BMKG data. Forecasts are not neighbourhood-scale and cannot explain a specific local flood on their own.",
    dataQuality: "Authoritative official source",
    processingHistory: "Referenced by link only. No data copied.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "bps",
    name: "BPS — Statistics Indonesia (Kota Bandar Lampung)",
    publisher: "Badan Pusat Statistik",
    url: "https://bandarlampungkota.bps.go.id",
    sourceType: "official",
    description:
      "Official statistics including population, demographic and social indicators, typically published in 'Kota Bandar Lampung Dalam Angka' and 'Kecamatan Dalam Angka' publications.",
    coverage: "Kota Bandar Lampung, kecamatan-level for many indicators",
    spatialResolution: "City and kecamatan",
    license: "Public statistics; cite BPS as source.",
    limitations:
      "No BPS figures are loaded into YouSee yet. Figures must be imported manually with year and table reference before any comparison is shown.",
    dataQuality: "Authoritative official source",
    processingHistory: "Referenced by link only.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "lapor",
    name: "SP4N-LAPOR! — National public complaints channel",
    publisher: "Government of Indonesia (KemenPAN-RB)",
    url: "https://www.lapor.go.id",
    sourceType: "official",
    description:
      "The national public service complaints and aspirations channel. Residents can submit reports that are routed to the responsible government agency.",
    coverage: "Indonesia",
    spatialResolution: "Not applicable",
    license: "YouSee does not access private or restricted LAPOR! records.",
    limitations:
      "YouSee is not connected to LAPOR!. Contributions to YouSee are NOT forwarded to government. Residents seeking an official response should use LAPOR! directly.",
    dataQuality: "Official channel",
    processingHistory: "Referenced by link only.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "pemkot-bandar-lampung",
    name: "Pemerintah Kota Bandar Lampung — official portal",
    publisher: "Pemerintah Kota Bandar Lampung",
    url: "https://bandarlampungkota.go.id",
    sourceType: "official",
    description:
      "Official city government portal: news, agency (OPD) information and, where published, planning documents such as RTRW (spatial plan) and RPJMD (medium-term development plan).",
    coverage: "Kota Bandar Lampung",
    spatialResolution: "City",
    license: "Public information; check document-specific terms.",
    limitations:
      "Planning documents (RTRW, RPJMD) have not yet been ingested. YouSee cannot yet answer which planning policy applies to a specific location.",
    dataQuality: "Official source",
    processingHistory: "Referenced by link only.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "osm",
    name: "OpenStreetMap — base map",
    publisher: "OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
    sourceType: "secondary",
    description: "Community-maintained base map used for map tiles in Explore and Share.",
    coverage: "Global",
    spatialResolution: "Feature-level",
    license: "ODbL — attribution required (shown on every map).",
    limitations: "Completeness of facilities, drainage and footpaths in Bandar Lampung is uneven and unverified.",
    dataQuality: "Variable, community-maintained",
    processingHistory: "Tiles displayed directly; no data extracted.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "yousee-community",
    name: "YouSee community contributions",
    publisher: "YouSee participants",
    url: "/explore",
    sourceType: "community",
    description:
      "Moderated, consented contributions shared by residents through YouSee. Only approved, public-consented records are used in summaries and retrieval.",
    coverage: "Kota Bandar Lampung (pilot) — uneven, depends on who participates",
    spatialResolution: "Privacy-reduced (~100 m, ~1 km, or district only)",
    license: "Used under participants' consent; no redistribution of raw records.",
    limitations:
      "Self-selected participation. Concentrations of reports reflect who participated, not necessarily where problems are most prevalent.",
    dataQuality: "Lived-experience evidence; not independently verified",
    processingHistory: "Moderated, then privacy-reduced, optionally AI-categorised, then human-reviewed.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "yousee-synthetic",
    name: "YouSee synthetic demonstration records",
    publisher: "YouSee team",
    url: "/data",
    sourceType: "synthetic",
    description:
      "A small set of invented records used only to demonstrate the workflow before real pilot data exists. They are labelled 'Synthetic demo' everywhere they appear.",
    coverage: "Illustrative only",
    spatialResolution: "Illustrative only",
    license: "Internal demo",
    limitations: "NOT real data. Must not be cited, analysed or presented as evidence. Can be hidden in Explore.",
    dataQuality: "Synthetic",
    processingHistory: "Hand-written by the YouSee team.",
    collectedAt: null,
    lastChecked: TODAY,
  },
  {
    slug: "yousee-methodology",
    name: "YouSee methodology documentation",
    publisher: "YouSee team",
    url: "/methodology",
    sourceType: "secondary",
    description: "YouSee's own documentation of its participation, mapping and AI methodology.",
    coverage: "Platform",
    spatialResolution: null,
    license: "Open documentation",
    limitations: "Exploratory methodology; not yet validated through pilot research.",
    dataQuality: "Internal documentation",
    processingHistory: "Written by the team.",
    collectedAt: null,
    lastChecked: TODAY,
  },
] as const;

const DOCS: { source: string; title: string; topic: string; body: string }[] = [
  {
    source: "bmkg",
    title: "Where to find weather and extreme-weather warnings",
    topic: "weather flooding rain hujan banjir cuaca extreme warning forecast",
    body: "BMKG (bmkg.go.id) publishes official weather forecasts and early warnings for extreme weather, including heavy rainfall, for Indonesian provinces and cities including Lampung. The BMKG website and the InfoBMKG mobile app are the authoritative places to check forecasts and warnings. YouSee does not currently ingest live BMKG data, so it cannot tell you today's forecast or confirm whether rain caused a specific flood.",
  },
  {
    source: "bmkg",
    title: "Limits of weather data for explaining local flooding",
    topic: "flooding drainage banjir why cause neighbourhood",
    body: "Weather and rainfall data describe conditions over a wide area. Local flooding in a neighbourhood typically depends on several factors at once — such as rainfall intensity, drainage capacity and maintenance, topography, land cover, and tides near the coast — and the contribution of each cannot be determined from forecasts alone. YouSee does not yet hold drainage, topography or flood-hazard datasets for Bandar Lampung, so it cannot explain why a particular area floods.",
  },
  {
    source: "bps",
    title: "Finding population and social statistics",
    topic: "population demographic penduduk statistics social data kecamatan",
    body: "BPS Kota Bandar Lampung (bandarlampungkota.bps.go.id) publishes official statistics such as population and social indicators, commonly in the annual 'Kota Bandar Lampung Dalam Angka' publication and kecamatan-level 'Kecamatan Dalam Angka' publications. YouSee has not yet imported BPS tables; numbers should be read from BPS directly and cited with year and table.",
  },
  {
    source: "lapor",
    title: "How to submit an official complaint to government",
    topic: "complaint report government official response lapor aduan public service",
    body: "SP4N-LAPOR! (lapor.go.id) is Indonesia's national channel for public service complaints and aspirations; reports are routed to the responsible agency. YouSee is a separate research and civic-learning platform: sharing an experience on YouSee does NOT send it to the government and does not guarantee any official response. If you need action from an agency, submit through LAPOR! as well.",
  },
  {
    source: "pemkot-bandar-lampung",
    title: "Urban planning documents (RTRW and RPJMD)",
    topic: "planning policy rtrw rpjmd zoning land use spatial plan tata ruang",
    body: "The RTRW (Rencana Tata Ruang Wilayah, spatial plan) and RPJMD (medium-term development plan) are the main planning documents for Kota Bandar Lampung. Where published, they can be found via the city government portal (bandarlampungkota.go.id) or the relevant agencies. YouSee has not yet ingested these documents, so it cannot state which planning policy applies to a specific location.",
  },
  {
    source: "pemkot-bandar-lampung",
    title: "Finding public services and agencies",
    topic: "public services health education puskesmas school agency layanan",
    body: "The city government portal lists city agencies (OPD) responsible for areas such as health, education, public works, and social affairs. YouSee does not yet have a verified dataset of facility locations such as puskesmas or schools in Bandar Lampung; such data must be imported from an official source and checked before facility-level answers can be given.",
  },
  {
    source: "yousee-methodology",
    title: "How YouSee turns experiences into insights",
    topic: "methodology insight how works process validation ai",
    body: "YouSee follows six stages: emotional mapping, cognitive mapping, spatial contextualisation, AI-assisted interpretation, collective validation, and civic insight. Original contributions are never edited by AI. AI outputs are stored separately and must be reviewed. Insights list the contributions and sources they draw on, a confidence level, an uncertainty note, and a representation note explaining who may be missing.",
  },
  {
    source: "yousee-methodology",
    title: "Why many reports in one place do not prove a problem is worst there",
    topic: "bias reports concentration prevalence representation missing",
    body: "The number of YouSee reports in an area reflects who knew about the platform, who had time and connectivity to participate, and who felt safe to share — not only how common a problem is. Areas with few reports may still face serious issues. YouSee shows coverage gaps on the Understand page to make this visible.",
  },
  {
    source: "yousee-methodology",
    title: "SheLens: women's urban experiences",
    topic: "shelens women perempuan gender safety inclusive",
    body: "SheLens is YouSee's first thematic initiative. It invites women and others who face additional barriers to share experiences of flooding, mobility, public spaces, services, weather and comfort in Bandar Lampung. Participation can be anonymous, location can be shared only at district level, and demographic questions are optional and used only with explicit consent.",
  },
];

const OPPORTUNITIES = [
  {
    kind: "service",
    title: "SAPA 129 — protection hotline for women and children",
    organization: "Kementerian Pemberdayaan Perempuan dan Perlindungan Anak (KemenPPPA)",
    description:
      "National hotline for reporting violence against women and children and seeking help. Check the official KemenPPPA site for current contact channels.",
    url: "https://www.kemenpppa.go.id",
    geographicScope: "National",
    lastVerified: TODAY,
    verificationNote: "Hotline name verified from public information; confirm current numbers on the official site.",
  },
  {
    kind: "information",
    title: "Official weather forecasts & early warnings",
    organization: "BMKG",
    description: "Check forecasts and extreme-weather warnings for Lampung before travelling during the rainy season.",
    url: "https://www.bmkg.go.id",
    geographicScope: "National / Lampung",
    lastVerified: TODAY,
    verificationNote: "Link to official agency.",
  },
  {
    kind: "service",
    title: "Submit an official public-service complaint",
    organization: "SP4N-LAPOR!",
    description: "Route complaints about public services to the responsible government agency.",
    url: "https://www.lapor.go.id",
    geographicScope: "National",
    lastVerified: TODAY,
    verificationNote: "Link to official channel.",
  },
  {
    kind: "employment",
    title: "Kartu Prakerja — skills training programme",
    organization: "Manajemen Pelaksana Program Kartu Prakerja",
    description:
      "Government programme for job-skills training. Eligibility, intake periods and benefits change — always check the official site.",
    url: "https://www.prakerja.go.id",
    geographicScope: "National",
    lastVerified: TODAY,
    verificationNote: "Programme exists; YouSee does not track open batches or eligibility.",
  },
  {
    kind: "information",
    title: "Kota Bandar Lampung statistics",
    organization: "BPS Kota Bandar Lampung",
    description: "Official population and social statistics for the city and its kecamatan.",
    url: "https://bandarlampungkota.bps.go.id",
    geographicScope: "Kota Bandar Lampung",
    lastVerified: TODAY,
    verificationNote: "Link to official agency.",
  },
  {
    kind: "community",
    title: "City government portal & agencies",
    organization: "Pemerintah Kota Bandar Lampung",
    description: "News, agency information and planning documents where published.",
    url: "https://bandarlampungkota.go.id",
    geographicScope: "Kota Bandar Lampung",
    lastVerified: TODAY,
    verificationNote: "Link to official portal.",
  },
];

// Synthetic demo contributions (clearly flagged). [area, kind, category, title, body, emotion, cognitive, initiative, dLat, dLng, precision]
const SYNTH: [string, string, string, string, string, string | null, string | null, "shelens" | "yousee", number, number, string][] = [
  ["Teluk Betung Selatan", "issue", "flooding", "Street floods after heavy rain", "[Synthetic demo] After an hour of heavy rain the street near the market fills with water up to the ankle. I carry my child across because the footpath disappears.", "frustrated", null, "shelens", 0.002, -0.003, "exact"],
  ["Teluk Betung Selatan", "experience", "flooding", "Drain covered by rubbish", "[Synthetic demo] The drain along the road is often blocked with plastic. Water stays for hours after rain and the smell is bad.", "sad", null, "yousee", -0.002, 0.002, "approximate"],
  ["Bumi Waras", "issue", "flooding", "Water enters houses during high tide and rain", "[Synthetic demo] When rain and high tide come together, water enters the ground floor. We move belongings up the stairs every rainy season.", "frustrated", null, "shelens", 0.001, 0.002, "approximate"],
  ["Bumi Waras", "cognitive", "flooding", "Route I avoid in rainy season", "[Synthetic demo] I take a longer route to work in the rainy season because the lower road floods quickly.", "unsafe", "avoid", "shelens", -0.002, -0.001, "area_only"],
  ["Tanjung Karang Pusat", "experience", "mobility", "Waiting for angkot without shelter", "[Synthetic demo] There is no shelter where I wait for the angkot. In the afternoon heat or rain I stand under a shop awning.", "frustrated", null, "shelens", 0.002, 0.001, "exact"],
  ["Tanjung Karang Pusat", "cognitive", "place_identity", "The old town feels like the heart of the city", "[Synthetic demo] The old shops and the street food in the evening make this area feel like home. I come here with my family on weekends.", "happy", "important", "yousee", -0.001, -0.002, "exact"],
  ["Enggal", "issue", "accessibility", "Footpath blocked by parked motorbikes", "[Synthetic demo] Pushing a stroller is very hard because motorbikes are parked on the footpath and the kerbs are high.", "frustrated", null, "shelens", 0.001, 0.0, "exact"],
  ["Enggal", "experience", "public_space", "Park is pleasant in the morning", "[Synthetic demo] The park is calm in the morning and many women walk there. In the evening some paths are dark.", "calm", "frequent", "shelens", -0.001, 0.002, "approximate"],
  ["Kedaton", "issue", "safety_comfort", "Dark stretch between bus stop and housing", "[Synthetic demo] The street from the main road to our housing has broken lights. I feel uncomfortable walking there after maghrib.", "unsafe", null, "shelens", 0.002, 0.001, "area_only"],
  ["Kedaton", "experience", "services", "Long queue at the health centre", "[Synthetic demo] I go early to the puskesmas with my mother. Seating is limited and the queue is long, but the staff are kind.", "neutral", null, "shelens", -0.002, -0.002, "approximate"],
  ["Rajabasa", "experience", "mobility", "Crossing the busy road near campus", "[Synthetic demo] Students cross the busy road without a safe crossing. Vehicles are fast and I wait a long time.", "unsafe", null, "yousee", 0.001, 0.002, "exact"],
  ["Rajabasa", "cognitive", "mobility", "My daily route to campus", "[Synthetic demo] My route from the boarding house to campus is short but has no continuous footpath.", "neutral", "route", "yousee", -0.001, 0.0, "approximate"],
  ["Way Halim", "experience", "public_space", "Sports field is a gathering place", "[Synthetic demo] On weekends families gather at the field. It is one of the few open spaces nearby.", "happy", "important", "yousee", 0.0, 0.002, "exact"],
  ["Kemiling", "experience", "weather_env", "Hot walk with no shade", "[Synthetic demo] Walking to the market at midday is very hot. There are few trees along the road.", "frustrated", null, "shelens", 0.002, 0.0, "approximate"],
  ["Panjang", "issue", "waste", "Rubbish piles near the coast", "[Synthetic demo] Rubbish collects near the shore and after rain it spreads into the road.", "sad", null, "yousee", 0.001, -0.002, "approximate"],
  ["Panjang", "cognitive", "place_identity", "The harbour where I grew up", "[Synthetic demo] My father worked at the harbour. The area has changed a lot but it still holds memories for me.", "calm", "memory", "yousee", -0.001, 0.001, "area_only"],
  ["Sukarame", "experience", "services", "School is far from home", "[Synthetic demo] My children travel far to school and I worry when it rains because the road floods.", "sad", null, "shelens", 0.002, -0.001, "area_only"],
  ["Teluk Betung Utara", "issue", "flooding", "Drainage channel overflows", "[Synthetic demo] The channel next to our alley overflows in heavy rain. Water reaches the doorstep.", "frustrated", null, "shelens", 0.001, 0.001, "approximate"],
];

let seeding: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      await runSeed();
      await ensureBootstrapAdmin();
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

/** Manually issued admin credential (preview bootstrap). Never a social login account. */
async function ensureBootstrapAdmin() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(424244)`);
    const cred = bootstrapAdminCredentials();
    const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, cred.email)).limit(1);
    if (existing) return;
    await tx.insert(users).values({
      displayName: "YouSee system administrator",
      email: cred.email,
      passwordHash: hashPassword(cred.password),
      provider: "manual",
      role: "admin",
      verified: true,
      isDemoAdmin: cred.isDemo,
      verificationNote: cred.isDemo
        ? "Preview bootstrap account, issued manually. Replace with ADMIN_BOOTSTRAP_* before production."
        : "Issued manually by the system operator via ADMIN_BOOTSTRAP_* environment variables.",
    });
  });
}

async function runSeed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
    const existing = await tx.select({ id: cities.id }).from(cities).limit(1);
    if (existing.length) return;

    const [yousee, shelens] = await tx
      .insert(initiatives)
      .values([
        {
          slug: "yousee",
          name: "YouSee Open City",
          tagline: "Everyday experiences of Bandar Lampung",
          description: "The general YouSee channel for any resident to share how they experience the city.",
        },
        {
          slug: "shelens",
          name: "SheLens",
          tagline: "Making women's urban experiences visible",
          description:
            "YouSee's flagship initiative focusing on the urban experiences, needs and perspectives of women and communities who face additional barriers.",
        },
      ])
      .returning();

    const [city] = await tx
      .insert(cities)
      .values({ slug: "bandar-lampung", name: "Bandar Lampung", country: "Indonesia", centerLat: -5.41, centerLng: 105.262, defaultZoom: 12 })
      .returning();

    const areaRows = await tx
      .insert(areas)
      .values(KECAMATAN.map(([name, lat, lng]) => ({ cityId: city.id, name, centroidLat: lat, centroidLng: lng, geometryNote: AREA_NOTE })))
      .returning();
    const areaByName = new Map(areaRows.map((a) => [a.name, a]));

    const srcRows = await tx.insert(evidenceSources).values(SOURCES.map((s) => ({ ...s }))).returning();
    const srcBySlug = new Map(srcRows.map((s) => [s.slug, s]));
    await tx.insert(knowledgeDocs).values(
      DOCS.map((d) => ({ sourceId: srcBySlug.get(d.source)!.id, title: d.title, topic: d.topic, body: d.body }))
    );
    await tx.insert(opportunities).values(OPPORTUNITIES);

    for (const [areaName, kind, category, title, body, emotion, cognitive, ini, dLat, dLng, precision] of SYNTH) {
      const a = areaByName.get(areaName)!;
      const lat = a.centroidLat + dLat;
      const lng = a.centroidLng + dLng;
      const pub = publicCoordinate(precision, lat, lng, a);
      const [c] = await tx
        .insert(contributions)
        .values({
          initiativeId: ini === "shelens" ? shelens.id : yousee.id,
          cityId: city.id,
          areaId: a.id,
          kind,
          category,
          title,
          body,
          emotion,
          cognitiveType: cognitive,
          geometryType: "point",
          geometry: { type: "Point", coordinates: [lng, lat] },
          locationPrecision: precision,
          publicLat: pub?.lat ?? null,
          publicLng: pub?.lng ?? null,
          participationMode: "anonymous",
          status: "approved",
          isSynthetic: true,
        })
        .returning();
      await tx.insert(consentRecords).values({
        contributionId: c.id,
        consentVersion: CONSENT_VERSION,
        publicDisplay: true,
        researchUse: true,
        demographicUse: false,
      });
    }

    await tx.insert(proposals).values({
      initiativeId: shelens.id,
      areaId: areaByName.get("Tanjung Karang Pusat")!.id,
      category: "mobility",
      title: "[Synthetic demo] Shaded waiting points at busy angkot stops",
      description:
        "Illustrative proposal: identify angkot stops where people wait without shade or rain cover and co-design simple shelters with residents.",
      authorPseudonym: "YouSee demo",
      status: "proposed",
      moderation: "approved",
      isSynthetic: true,
    });
  });
}
