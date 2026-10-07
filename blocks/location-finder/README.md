# Location Finder

Intro text, a location search and a "Map view" switch beside an OpenStreetMap map of every
center in a GeoJSON feed. A search finds the place (OpenStreetMap Nominatim, US only) and lists
the centers within 100 km, nearest first. Clicking a pin highlights its result card (or shows that
center alone); clicking a card zooms the map to it. Switching the map off shows the results as a
full-width grid.

## Authoring (one field per row)

| Field | Content |
| --- | --- |
| Intro text | Heading + paragraph |
| Locations data URL | GeoJSON FeatureCollection, e.g. `https://www.destinationpet.com/content/dam/yourgi/us/en/events/location.json` |
| Search placeholder | e.g. `Enter a location` |
| No results message | Heading + paragraph shown when a search finds no center |

Feature properties used: `centerid`, `name`, `logo` (resolved against the data URL), `category`
(`Vet Center` = grey pin, anything else = orange pin), `phone`, `Address`, `sitename`, `tags`, `rating`.

The data URL must allow cross-origin requests (the live destinationpet.com file does).

## Third-party services

- Leaflet 1.9.4 from unpkg (pinned with SRI), loaded after the block renders.
- Map tiles: `tile.openstreetmap.org` (attribution shown on the map). For high traffic, switch
  `TILES` in `location-finder.js` to a commercial tile provider.
- Geocoding: `nominatim.openstreetmap.org`, called once per submitted search.
