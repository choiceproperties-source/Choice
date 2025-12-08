import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapSectionProps {
  center: LatLngTuple;
  title: string;
  address: string;
}

export function MapSection({ center, title, address }: MapSectionProps) {
  // Check if coordinates are valid
  if (!center || !center[0] || !center[1]) {
    return (
      <div 
        className="w-full h-[400px] rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
        data-testid="section-map-unavailable"
      >
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Location data unavailable.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700"
      data-testid="section-map"
    >
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "400px", width: "100%" }}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} data-testid="marker-property">
          <Popup data-testid="popup-property">
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-gray-600">{address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
