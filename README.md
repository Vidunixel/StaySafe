  # StaySafe — Victoria Crime Prediction and Community Safety Map
  StaySafe is a web application that visualizes predicted crime risk across Victoria and allows users to submit real‑time incident reports. The platform combines machine‑learning predictions with public infrastructure data to help residents make informed safety decisions.

  ## Features
  ### Crime Prediction Heatmap
  Interactive map displaying predicted crime risk levels across Victoria using color‑coded intensity.

  ### Community Incident Reporting
  Users can click on the map to submit incident reports. Recent reports appear in a live feed with timestamps and categories.

  ### Safety Infrastructure Layers
  Includes street‑lighting data, CCTV camera locations, and police station markers to provide additional context for navigating public spaces.


  ## Data Sources
  - Crime prediction model outputs
  - User‑submitted incident reports
  - Public datasets for lighting, CCTV, and police stations
  - OpenStreetMap and CARTO basemaps

  ## How It Works
  1. Load the map and explore the predicted crime risk
  2. Submit an incident by selecting a location
  3. Review recent community reports (24hrs)
  4. Toggle safety layers for lighting, CCTV, police stations

  ## Tech Stack
  - Next.js / React
  - Leaflet with OpenStreetMap and CARTO
  - Vercel hosting
  - API endpoints for data handling

  ## Status
  - Core map and reporting system functional
  - Three of six datasets currently integrated
  - Additional data and model improvements planned

  # Live Demo
  https://stay-safe-vic.vercel.app/

  ## Running the code locally 

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

