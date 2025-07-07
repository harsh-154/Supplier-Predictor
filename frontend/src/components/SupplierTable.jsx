import React from "react";

export default function SupplierTable({ suppliers }) {
  return (
    <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
      <thead>
        <tr>
          <th>Product</th>
          <th>Supplier ID</th>
          <th>City</th>
          <th>Country</th>
          <th>Combined Score</th>
          <th>Failure Prob</th>
          <th>Distance (km)</th>
        </tr>
      </thead>
      <tbody>
        {suppliers.map((s, i) => (
          <tr key={i}>
            <td>{s.Product}</td>
            <td>{s.SupplierID}</td>
            <td>{s.City}</td>
            <td>{s.Country}</td>
            <td>{s.CombinedScore?.toFixed(3)}</td>
            <td>{s.FailureProb?.toFixed(2)}</td>
            <td>{s.DistanceKM?.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
