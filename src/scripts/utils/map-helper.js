import * as L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const MapHelper = {
  initMap(containerId, options = {}) {
    const lat = options.lat || -2.5;
    const lng = options.lng || 118;
    const zoom = options.zoom || 5;

    const map = L.map(containerId).setView([lat, lng], zoom);

    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' },
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri' },
    );

    osmLayer.addTo(map);

    L.control.layers({
      'Peta Jalan': osmLayer,
      'Satelit': satelliteLayer,
    }).addTo(map);

    return map;
  },

  addMarker(map, lat, lng, popupText, options = {}) {
    const marker = L.marker([lat, lng], {
      icon: options.icon || defaultMarkerIcon,
      title: options.title || 'Lokasi cerita',
      alt: options.alt || 'Penanda lokasi cerita',
    }).addTo(map);
    if (popupText) marker.bindPopup(popupText);
    return marker;
  },
};

export default MapHelper;
