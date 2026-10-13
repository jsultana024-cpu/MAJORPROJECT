// Location naam theke latitude/longitude ber kore (OpenStreetMap Nominatim, free, API key lage na)
module.exports = async function geocode(location, country) {
  const q = [location, country].filter(Boolean).join(", ").trim();
  if (!q) return null;
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: { "User-Agent": "Wanderlust-Project/1.0 (student project)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.log("Geocoding failed:", err.message);
    return null;
  }
};
