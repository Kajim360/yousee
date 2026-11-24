# Data Sources

The canonical, user-visible registry is the `evidence_sources` table (rendered at `/data`). Seeded entries:

| Slug | Source | Type | Ingested? |
|---|---|---|---|
| bmkg | BMKG, bmkg.go.id | official | link only |
| bps | BPS Kota Bandar Lampung | official | link only |
| lapor | SP4N-LAPOR!, lapor.go.id | official | link only. No access to restricted records |
| pemkot-bandar-lampung | City government portal (RTRW/RPJMD where published) | official | link only |
| osm | OpenStreetMap | secondary | base-map tiles (ODbL attribution shown) |
| yousee-community | moderated contributions | community | yes |
| yousee-synthetic | demo records | synthetic | yes, labelled |
| yousee-methodology | YouSee docs | secondary | yes |

## Districts
20 kecamatan with hand-placed **approximate** centroids. They are not boundaries. **Next step:** import official administrative boundaries (BIG / BPS) as GeoJSON with licence and date documented.

## Ingestion rules
1. Confirm licence and terms; never scrape without permission.
2. Record source, collection date, coverage, resolution, limitations, quality and processing history.
3. Distinguish official, secondary, community, synthetic and AI-generated data.
4. Start small: boundaries, then facilities, then flood-prone areas, then BPS kecamatan indicators, then RTRW text.
