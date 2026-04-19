# StaySafe - Victoria Crime Prediction and Community Safety Map

**Live Deployment:** [stay-safe-vic.vercel.app](https://stay-safe-vic.vercel.app/)

**Devpost:** [devpost.com/software/staysafe-zjv3fg](https://devpost.com/software/staysafe-zjv3fg)

StaySafe is a web application that visualizes predicted crime risk across Victoria and allows users to submit real‑time incident reports. The platform combines machine‑learning predictions with public infrastructure data to help residents make informed safety decisions.

| <img width="600" alt="Predicted crime rate for Melbourne." src="https://github.com/user-attachments/assets/25210f7c-c203-499e-878f-731ac19e09ff" /> | 
|:--:| 
| *Predicted crime rate for Melbourne.* |

| <img width="600" alt="CCTV locations in Geelong." src="https://github.com/user-attachments/assets/7d49240d-6744-4703-b05e-2b28bbbb57fc" /> |
|:--:| 
| *CCTV locations in Geelong.* |

| <img width="600" alt="Pedestrian Network in Melbourne CBD." src="https://github.com/user-attachments/assets/e1a3438f-3246-45f8-8d3f-4591724ceaaf" /> |
|:--:| 
| *Pedestrian Network in Melbourne CBD.* |

| <img width="600" alt="Navigation Demo from Monash University Clayton to Melbourne Central." src="https://github.com/user-attachments/assets/0a014283-3831-4ffa-96df-8e295e9b2173" /> |
|:--:| 
| *Navigation Demo from Monash University Clayton to Melbourne Central.* |

| <img width="600" alt="Police station marker - Clayton Police Station." src="https://github.com/user-attachments/assets/34bed9ca-98ee-449e-ae8e-7e30d57b93c1" /> |
|:--:| 
| *Police station marker - Clayton Police Station.* |

| <img width="600" alt="Demo of reporting an incident." src="https://github.com/user-attachments/assets/08192f02-2566-43d8-a6ec-a1ef3f3383e0" /> |
|:--:| 
| *Demo of reporting an incident.* |

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

## Running the code locally 

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

