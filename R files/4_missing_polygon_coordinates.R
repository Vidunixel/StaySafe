library(sf)
library(ozmaps)
library(jsonlite)

# Load LGA data
lga_sf <- ozmap_data("abs_lga")

# Function to get a simple nested coordinate list for a given row
get_lga_coords <- function(row_number) {
  lga <- lga_sf[row_number, ]
  
  lapply(lga$geometry, function(poly) {
    coords <- st_coordinates(poly)[, 1:2]  # only X/Y
    lapply(1:nrow(coords), function(i) as.numeric(coords[i, ]))
  })
}

# Example usage:
# For Bayside (row 383)
bayside_coords <- get_lga_coords(383)

# For another LGA, e.g., row 420
colac_otway_coords <- get_lga_coords(94)

kingston_coords <- get_lga_coords(222)

latrobe_coords <- get_lga_coords(221)

# Convert to JSON if you want to print or export
bayside_json <- jsonlite::toJSON(bayside_coords, auto_unbox = TRUE, pretty = TRUE)
cat(bayside_json)

colac_otway_json <- jsonlite::toJSON(colac_otway_coords, auto_unbox = TRUE, pretty = TRUE)
cat(colac_otway_json)

kingston_json <- jsonlite::toJSON(kingston_coords, auto_unbox = TRUE, pretty = TRUE)
cat(kingston_json)

latrobe_json <- jsonlite::toJSON(latrobe_coords, auto_unbox = TRUE, pretty = TRUE)
cat(latrobe_json)
