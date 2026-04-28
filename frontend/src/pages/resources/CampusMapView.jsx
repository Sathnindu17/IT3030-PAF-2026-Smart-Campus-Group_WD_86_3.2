import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { resourcesAPI } from '../../api/axios';

const CAMPUS_CENTER = [6.9147, 79.9729];
const CAMPUS_LAT_MIN = 6.9135;
const CAMPUS_LAT_MAX = 6.9157;
const CAMPUS_LNG_MIN = 79.9714;
const CAMPUS_LNG_MAX = 79.9741;
const CAMPUS_EDGE_PADDING = 0.00012;

// Campus boundary polygon
const CAMPUS_POLYGON = [
  [CAMPUS_LAT_MIN, CAMPUS_LNG_MIN],
  [CAMPUS_LAT_MIN, CAMPUS_LNG_MAX],
  [CAMPUS_LAT_MAX, CAMPUS_LNG_MAX],
  [CAMPUS_LAT_MAX, CAMPUS_LNG_MIN],
];

const CAMPUS_MAX_BOUNDS = [
  [CAMPUS_LAT_MIN, CAMPUS_LNG_MIN],
  [CAMPUS_LAT_MAX, CAMPUS_LNG_MAX],
];

// Predefined SLIIT campus locations with exact coordinates
const SLIIT_LOCATION_POINTS = [
  { ids: ['a block', 'block a', 'A Block'], point: [6.9149, 79.9722] },
  { ids: ['b block', 'block b', 'B Block'], point: [6.9152, 79.9728] },
  { ids: ['c block', 'block c', 'C Block'], point: [6.9151, 79.9735] },
  { ids: ['d block', 'block d', 'D Block'], point: [6.9146, 79.9738] },
  { ids: ['e block', 'block e', 'E Block'], point: [6.9142, 79.9733] },
  { ids: ['f block', 'block f', 'F Block'], point: [6.9141, 79.9726] },
  { ids: ['g block', 'block g', 'G Block'], point: [6.9145, 79.9720] },
  { ids: ['h block', 'block h', 'H Block'], point: [6.9150, 79.9716] },
  { ids: ['new building', 'new block', 'New Building'], point: [6.9137, 79.9730] },
  { ids: ['library', 'Library'], point: [6.9148, 79.9730] },
  { ids: ['auditorium', 'main hall', 'Main Hall / Auditorium'], point: [6.9143, 79.9724] },
  { ids: ['lab complex', 'labs', 'Lab Complex'], point: [6.9153, 79.9731] },
  { ids: ['car park', 'parking', 'Car Park / Parking'], point: [6.9139, 79.9721] },
];

function hashToOffset(value, spread) {
  let hash = 0;
  const text = value || '';
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const normalized = ((hash % 1000) + 1000) % 1000;
  return (normalized / 1000 - 0.5) * spread;
}

function locationToPoint(location, id) {
  if (!location) {
    return clampToCampus(CAMPUS_CENTER, 0);
  }

  const normalizedLocation = location.toLowerCase().trim();
  
  // Try exact match first
  let matched = SLIIT_LOCATION_POINTS.find((entry) =>
    entry.ids.some((loc) => normalizedLocation.includes(loc.toLowerCase()))
  );
  
  if (matched) {
    return clampToCampus(matched.point, 0);
  }

  // Try fuzzy matching for common variations
  if (normalizedLocation.includes('block') && normalizedLocation.length <= 10) {
    const blockChar = normalizedLocation.match(/[a-h]/i)?.[0]?.toLowerCase();
    if (blockChar) {
      matched = SLIIT_LOCATION_POINTS.find((entry) =>
        entry.ids.some((loc) => loc.toLowerCase().includes(blockChar))
      );
      if (matched) {
        return clampToCampus(matched.point, 0);
      }
    }
  }

  // Try keyword matching for other locations
  const keywords = ['library', 'auditorium', 'main', 'hall', 'lab', 'labs', 'car', 'park', 'parking', 'new', 'building'];
  for (const keyword of keywords) {
    if (normalizedLocation.includes(keyword)) {
      matched = SLIIT_LOCATION_POINTS.find((entry) =>
        entry.ids.some((loc) => loc.toLowerCase().includes(keyword))
      );
      if (matched) {
        return clampToCampus(matched.point, 0);
      }
    }
  }

  // Default to campus center - always safe
  return clampToCampus(CAMPUS_CENTER, 0);
}

function isInsideCampus(point) {
  if (!point) return false;
  return point[0] >= CAMPUS_LAT_MIN
    && point[0] <= CAMPUS_LAT_MAX
    && point[1] >= CAMPUS_LNG_MIN
    && point[1] <= CAMPUS_LNG_MAX;
}

function clampToCampus(point, padding = 0) {
  const safeLatMin = CAMPUS_LAT_MIN + padding;
  const safeLatMax = CAMPUS_LAT_MAX - padding;
  const safeLngMin = CAMPUS_LNG_MIN + padding;
  const safeLngMax = CAMPUS_LNG_MAX - padding;

  return [
    Math.min(Math.max(point[0], safeLatMin), safeLatMax),
    Math.min(Math.max(point[1], safeLngMin), safeLngMax),
  ];
}

function distanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function MapClickCapture({ onSelect }) {
  useMapEvents({
    click: (event) => {
      onSelect(clampToCampus([event.latlng.lat, event.latlng.lng]));
    },
  });
  return null;
}

export default function CampusMapView() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: 'ACTIVE',
    radius: 300,
  });
  const [nearbyCenter, setNearbyCenter] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        const res = await resourcesAPI.getAll(params);
        setResources(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [filters.type, filters.status]);

  const mapResources = useMemo(() => {
    return resources.map((resource) => {
      const point = locationToPoint(resource.location, resource.id);
      // Final safety clamp to ensure no point goes outside bounds
      const clampedPoint = clampToCampus(point, 0);
      return {
        ...resource,
        point: clampedPoint,
      };
    });
  }, [resources]);

  const visibleResources = useMemo(() => {
    if (!nearbyCenter) return mapResources;
    return mapResources.filter((resource) => distanceMeters(resource.point, nearbyCenter) <= filters.radius);
  }, [mapResources, nearbyCenter, filters.radius]);

  const markerColor = () => '#dc2626';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2>SLIIT Campus Resource Map</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/app/resources')}>Back to Resources</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EXAM_HALL">Exam Hall</option>
                <option value="AUDITORIUM">Auditorium</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="UNDER_RENOVATION">Under Renovation</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nearby Radius ({filters.radius}m)</label>
              <input type="range" min="100" max="1200" step="50" className="form-control" value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#64748b' }}>
            Click map to set nearby center inside SLIIT campus boundary. Use SLIIT locations like A Block, B Block, New Building, Library, Main Hall for accurate pins. {nearbyCenter ? ' Showing only resources inside selected radius.' : ' Showing all resources.'}
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div> Loading map resources...</div>
          ) : (
            <>
              <div className="campus-map-wrap">
                <MapContainer
                  center={CAMPUS_CENTER}
                  zoom={16}
                  minZoom={15}
                  maxZoom={19}
                  maxBounds={CAMPUS_MAX_BOUNDS}
                  maxBoundsViscosity={1.0}
                  className="campus-map-canvas"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickCapture onSelect={setNearbyCenter} />

                  <Polygon
                    positions={CAMPUS_POLYGON}
                    pathOptions={{ color: '#1e3a8a', weight: 2, fillColor: '#93c5fd', fillOpacity: 0.08 }}
                  />

                  {nearbyCenter && (
                    <>
                      <Circle center={nearbyCenter} radius={filters.radius} pathOptions={{ color: '#1d4ed8', fillColor: '#bfdbfe', fillOpacity: 0.18 }} />
                      <CircleMarker center={nearbyCenter} radius={7} pathOptions={{ color: '#1e3a8a', fillColor: '#2563eb', fillOpacity: 0.95 }} />
                    </>
                  )}

                  {visibleResources.map((resource) => (
                    <CircleMarker
                      key={resource.id}
                      center={resource.point}
                      radius={8}
                      pathOptions={{ color: '#0f172a', weight: 1.2, fillColor: markerColor(resource.id), fillOpacity: 0.9 }}
                    >
                      <Popup>
                        <div style={{ minWidth: 200 }}>
                          <strong>{resource.name}</strong>
                          <div>{resource.type?.replace(/_/g, ' ')}</div>
                          <div>Capacity: {resource.capacity}</div>
                          <div>Location: {resource.location}</div>
                          <div>Status: {resource.status}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#475569' }}>Markers: blue = your location point, red = resource location points.</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{isInsideCampus(nearbyCenter) ? 'Nearby center is inside campus area.' : 'Select a nearby center on map to filter inside campus.'}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{visibleResources.length} resources visible on map.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
