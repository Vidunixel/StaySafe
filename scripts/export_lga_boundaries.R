# One-off export of Victorian LGA boundaries for the offline crime_stats table.
#
# Uses the same ozmaps "abs_lga" layer (ABS 2018 LGAs) that
# "R files/4_missing_polygon_coordinates.R" used to fill the old Supabase table,
# and writes it as GeoJSON so the Docker build only needs Node.
#
# Run from the repo root (needs the sf + ozmaps packages):
#   Rscript scripts/export_lga_boundaries.R
# Output: data/lga/vic_lga_boundaries.geojson (committed, so this rarely needs re-running)

suppressMessages({
  library(sf)
  library(ozmaps)
})

lga <- st_transform(ozmap_data("abs_lga"), 4326)
states <- st_transform(ozmap_data("states"), 4326)

# Keep LGAs whose interior point is nearest to Victoria. Names alone are
# ambiguous (Bayside, Kingston and Latrobe exist in other states too), and a
# plain "inside Victoria" test drops Queenscliffe, whose point falls just
# outside the simplified coastline.
sf_use_s2(FALSE)
nearest <- suppressWarnings(st_nearest_feature(st_point_on_surface(lga), states))
lga <- lga[states$NAME[nearest] == "Victoria" & lga$NAME != "Unincorporated Vic", ]

# "Alpine (S)" -> "Alpine", "Kingston (C) (Vic.)" -> "Kingston"
clean <- trimws(gsub("\\s*\\([^)]*\\)", "", lga$NAME))
# Renamed since the 2018 boundaries
clean[clean == "Moreland"] <- "Merri-bek"
lga$lga <- clean

out <- lga[, c("lga", "NAME")]
names(out)[names(out) == "NAME"] <- "abs_name"

dir.create("data/lga", showWarnings = FALSE, recursive = TRUE)
dest <- "data/lga/vic_lga_boundaries.geojson"
if (file.exists(dest)) file.remove(dest)
st_write(out, dest, driver = "GeoJSON",
         layer_options = c("COORDINATE_PRECISION=5", "RFC7946=YES"), quiet = TRUE)
cat("Wrote", nrow(out), "Victorian LGAs to", dest, "\n")
