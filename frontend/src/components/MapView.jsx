import React, { useEffect, useRef } from 'react';
// Leaflet is loaded via script tags in index.html, so no direct import here.
// We access L from the global window object.

export default function MapView({ suppliers }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); // To store the Leaflet map instance

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Ensure Leaflet 'L' object is available
    if (typeof window.L === 'undefined') {
      console.error("Leaflet library (L) not found. Make sure it's loaded in index.html.");
      return;
    }

    // Initialize map only once
    if (!mapInstanceRef.current) {
      // Set default view to a central point (e.g., world view) if no suppliers or invalid coords
      const defaultLat = 20.5937; // Center of India, or a more global view if preferred
      const defaultLon = 78.9629;
      const defaultZoom = 2; // World view zoom

      mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLon], defaultZoom);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Invalidate map size to ensure it renders correctly after its container is visible
    // This is crucial for fixing the "half map" issue
    map.invalidateSize();

    // Clear existing markers before adding new ones
    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each supplier
    if (suppliers && suppliers.length > 0) {
      const markers = [];
      suppliers.forEach(supplier => {
        const lat = supplier.Latitude;
        const lon = supplier.Longitude;
        const productName = supplier.Product;
        const supplierID = supplier.SupplierID;
        const city = supplier.City;
        const country = supplier.Country;
        const failureProb = supplier.FailureProb?.toFixed(2);
        const distanceKM = supplier.DistanceKM?.toFixed(1);

        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
          const marker = window.L.marker([lat, lon]).addTo(map);
          marker.bindPopup(`
            <b>${productName}</b><br>
            Supplier ID: ${supplierID}<br>
            Location: ${city}, ${country}<br>
            Failure Prob: ${failureProb}<br>
            Distance: ${distanceKM} km
          `);
          markers.push(marker);
        } else {
          console.warn(`Invalid coordinates for supplier: ${supplierID} (${lat}, ${lon})`);
        }
      });

      // Fit map bounds to all markers, or center on a single marker if only one
      if (markers.length > 0) {
        const group = new window.L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.5)); // Add padding
      }
    } else {
      // If no suppliers, set view to a default global view
      map.setView([20.5937, 78.9629], 2);
    }

    // Cleanup function (optional, but good practice for map instances)
    return () => {
      // map.remove(); // Only remove if you want to completely destroy the map instance on unmount
    };
  }, [suppliers]); // Re-run effect if suppliers data changes

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-xl mt-6 w-full">
      <h2 className="text-3xl font-bold text-blue-300 mb-4 text-center">Supplier Locations Map</h2>
      {/* Map container - ensure it has a defined height */}
      <div ref={mapContainerRef} className="w-full h-[500px] rounded-lg border border-gray-600">
        {/* Map will render here */}
      </div>
      <p className="text-sm text-gray-400 mt-4 text-center">
        Click on markers for supplier details.
      </p>
    </div>
  );
}