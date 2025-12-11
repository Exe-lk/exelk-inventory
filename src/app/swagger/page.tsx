"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerPage() {
  const customCSS = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    }
    .swagger-ui .scheme-container { 
      background: #fafafa; 
      padding: 20px; 
      border-radius: 4px; 
    }
  `;

  return (
    <div style={{ height: "100vh", padding: "20px" }}>
      <style>{customCSS}</style>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
          Exelk Inventory Management API Documentation
        </h1>
        <p style={{ color: "#666", marginTop: "8px" }}>
          Complete API documentation for the inventory management system
        </p>
      </div>
      <SwaggerUI 
        url="/api/docs" 
        deepLinking={true}
        displayRequestDuration={true}
        docExpansion="none"
        filter={true}
      />
    </div>
  );
}