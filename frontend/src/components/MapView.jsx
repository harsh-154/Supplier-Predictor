import React, { useEffect, useRef } from 'react';
// Leaflet is loaded via script tags in index.html, so no direct import here.
// We access L from the global window object.

export default function MapView({ suppliers, selectedDcCity, warehouses }) { // Receive warehouses
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); // To store the Leaflet map instance

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (typeof window.L === 'undefined') {
      console.error("Leaflet library (L) not found. Make sure it's loaded in index.html.");
      return;
    }

    if (!mapInstanceRef.current) {
      // --- CHANGES START HERE ---
      // Coordinates for the approximate center of India
      const defaultLat = 22.3511147;
      const defaultLon = 78.6677428;
      // Zoom level adjusted for India (higher zoom for closer view)
      const defaultZoom = 5; // You can adjust this value (e.g., 4 to 6)

      mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLon], defaultZoom);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Optional: Set maxBounds to restrict panning outside India
      // These bounds are approximate for India
      const southWest = window.L.latLng(6.0, 68.0);
      const northEast = window.L.latLng(37.0, 98.0);
      const bounds = window.L.latLngBounds(southWest, northEast);
      mapInstanceRef.current.setMaxBounds(bounds);
      mapInstanceRef.current.options.minZoom = 4; // Prevent zooming out too far
      // --- CHANGES END HERE ---
    }

    const map = mapInstanceRef.current;
    map.invalidateSize();

    // Clear existing markers before adding new ones
    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    const allMarkers = [];

    // Custom icon for Distribution Center (selected warehouse)
    const dcIcon = window.L.divIcon({
      className: 'custom-dc-icon',
      html: '<div class="bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-blue-200 animate-pulse font-bold text-xs">DC</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Custom icon for other Warehouses
    const warehouseIcon = window.L.divIcon({
      className: 'custom-warehouse-icon',
      html: '<div class="bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-red-200 font-bold text-xs">WH</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Add warehouse markers
    if (warehouses && warehouses.length > 0) {
      warehouses.forEach(wh => {
        const lat = wh.Latitude;
        const lon = wh.Longitude;
        const city = wh.City;
        const country = wh.Country;
        const warehouseID = wh.WarehouseID;

        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
          let marker;
          if (city === selectedDcCity) {
            marker = window.L.marker([lat, lon], { icon: dcIcon });
            marker.bindPopup(`<b>Distribution Center: ${city}, ${country} (${warehouseID})</b>`);
          } else {
            marker = window.L.marker([lat, lon], { icon: warehouseIcon });
            marker.bindPopup(`<b>Warehouse: ${city}, ${country} (${warehouseID})</b>`);
          }
          marker.addTo(map);
          allMarkers.push(marker);
        } else {
          console.warn(`Invalid coordinates for warehouse: ${warehouseID} (${lat}, ${lon})`);
        }
      });
    }

    // Add supplier markers
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(supplier => {
        const lat = supplier.Latitude;
        const lon = supplier.Longitude;
        const productName = supplier.Product;
        const supplierID = supplier.SupplierID;
        const supplierName = supplier.SupplierName;
        const category = supplier.Category;
        const city = supplier.City;
        const country = supplier.Country;
        const failureProb = supplier.FailureProb?.toFixed(2);
        const distanceKM = supplier.DistanceKM?.toFixed(1);

        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
          // Only add supplier markers if they are not the selected DC city (to avoid duplicate markers on DC location)
          if (!(selectedDcCity && city === selectedDcCity)) {
            const marker = window.L.marker([lat, lon]);
            marker.bindPopup(`
              <b>${supplierName} (${supplierID})</b><br>
              Product: ${productName} (${category})<br>
              Location: ${city}, ${country}<br>
              Failure Prob: ${failureProb}<br>
              Distance from DC: ${distanceKM} km
            `);
            marker.addTo(map);
            allMarkers.push(marker);
          }
        } else {
          console.warn(`Invalid coordinates for supplier: ${supplierID} (${lat}, ${lon})`);
        }
      });
    }

    // Fit map bounds to all markers (suppliers and warehouses)
    if (allMarkers.length > 0) {
      const group = new window.L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.5));
    } else if (warehouses.length > 0) {
      // If no suppliers, but warehouses exist, fit to warehouses
      const warehouseMarkers = warehouses.map(wh => window.L.marker([wh.Latitude, wh.Longitude]));
      const group = new window.L.featureGroup(warehouseMarkers);
      map.fitBounds(group.getBounds().pad(0.5));
    }
    else {
      // Fallback to India view if no data
      map.setView([defaultLat, defaultLon], defaultZoom);
    }

    // Add custom CSS for the div icons (Tailwind classes)
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .custom-dc-icon, .custom-warehouse-icon {
        background-color: transparent;
        border: none;
      }
    `;
    document.head.appendChild(styleTag);

  }, [suppliers, selectedDcCity, warehouses]); // Re-run effect if any of these props change

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-xl mt-6 w-full">
      <h2 className="text-3xl font-bold text-blue-300 mb-4 text-center">Supplier & Warehouse Locations Map</h2>
      <div ref={mapContainerRef} className="w-full h-[500px] rounded-lg border border-gray-600">
        {/* Map will render here */}
      </div>
      <p className="text-sm text-gray-400 mt-4 text-center">
        Click on markers for details. <span className="text-blue-300">Blue "DC"</span> is the selected warehouse. <span className="text-red-300">Red "WH"</span> are other warehouses.
      </p>
    </div>
  );
}
