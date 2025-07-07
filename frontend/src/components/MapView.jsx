import React, { useEffect, useRef } from 'react';
// Leaflet is loaded via script tags in index.html, so no direct import here.
// We access L from the global window object.

export default function MapView({ suppliers, selectedDcCity }) { // Receive selectedDcCity
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
      const defaultLat = 20.5937;
      const defaultLon = 78.9629;
      const defaultZoom = 2;

      mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLon], defaultZoom);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    map.invalidateSize(); // Crucial for fixing the "half map" issue

    // Clear existing markers before adding new ones
    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    const markers = [];
    let dcMarker = null;

    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(supplier => {
        const lat = supplier.Latitude;
        const lon = supplier.Longitude;
        const productName = supplier.Product;
        const supplierID = supplier.SupplierID;
        const supplierName = supplier.SupplierName; // New field
        const category = supplier.Category; // New field
        const city = supplier.City;
        const country = supplier.Country;
        const failureProb = supplier.FailureProb?.toFixed(2);
        const distanceKM = supplier.DistanceKM?.toFixed(1);

        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
          const marker = window.L.marker([lat, lon]);
          marker.bindPopup(`
            <b>${supplierName} (${supplierID})</b><br>
            Product: ${productName} (${category})<br>
            Location: ${city}, ${country}<br>
            Failure Prob: ${failureProb}<br>
            Distance from DC: ${distanceKM} km
          `);
          markers.push(marker);

          // Check if this supplier's city is the selected DC city
          if (selectedDcCity && city === selectedDcCity) {
            // Create a special icon for the DC
            const dcIcon = window.L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-blue-200 animate-pulse">DC</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15], // Center the icon
            });
            dcMarker = window.L.marker([lat, lon], { icon: dcIcon }).addTo(map);
            dcMarker.bindPopup(`<b>Distribution Center: ${city}, ${country}</b>`);
          }
        } else {
          console.warn(`Invalid coordinates for supplier: ${supplierID} (${lat}, ${lon})`);
        }
      });

      // Add all supplier markers to the map
      markers.forEach(marker => marker.addTo(map));

      // Fit map bounds to all markers (including DC if present)
      const allMapElements = markers.concat(dcMarker ? [dcMarker] : []);
      if (allMapElements.length > 0) {
        const group = new window.L.featureGroup(allMapElements);
        map.fitBounds(group.getBounds().pad(0.5));
      }
    } else {
      map.setView([20.5937, 78.9629], 2); // Default view if no suppliers
    }

    // Add a custom CSS class for the DC icon (Tailwind)
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .custom-div-icon {
        background-color: transparent;
        border: none;
      }
    `;
    document.head.appendChild(styleTag);

  }, [suppliers, selectedDcCity]); // Re-run effect if suppliers data or selectedDcCity changes

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-xl mt-6 w-full">
      <h2 className="text-3xl font-bold text-blue-300 mb-4 text-center">Supplier Locations Map</h2>
      <div ref={mapContainerRef} className="w-full h-[500px] rounded-lg border border-gray-600">
        {/* Map will render here */}
      </div>
      <p className="text-sm text-gray-400 mt-4 text-center">
        Click on markers for supplier details. The selected warehouse city is highlighted with a blue "DC" marker.
      </p>
    </div>
  );
}
