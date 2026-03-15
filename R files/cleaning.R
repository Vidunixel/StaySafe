library(sf)
library(ozmaps)
library(dplyr)

# Load the package
library(readxl)

lga_sf <- ozmap_data("abs_lga")

lga_sf

df <- read.csv("street_lights.csv")

mean(df$brightness)

coords <- do.call(rbind, strsplit(df$geo_point_2d, ","))

df$lat <- as.numeric(coords[,1])
df$lon <- as.numeric(coords[,2])

points_sf <- st_as_sf(
  df,
  coords = c("lon","lat"),
  crs = 4326
)

points_sf <- st_transform(points_sf, st_crs(lga_sf))

points_with_lga <- st_join(points_sf, lga_sf)

points_with_lga$LGA <- points_with_lga$NAME

write.csv(st_drop_geometry(points_with_lga),
          "street_lights_with_lga.csv",
          row.names = FALSE)

brightness_by_lga <- points_with_lga %>%
  st_drop_geometry() %>%
  group_by(NAME) %>%
  summarise(avg_brightness = mean(brightness, na.rm = TRUE))

brightness_by_lga <- brightness_by_lga %>%
  mutate(NAME = gsub("\\s*\\(.*\\)", "", NAME))

# Check unique names
unique(brightness_by_lga$NAME)

crime_sept_2025 <- read_excel("sept_2025_lga.xlsx", sheet = "Table 02") %>%
  rename(LGA = `Local Government Area`) %>%
  left_join(brightness_by_lga %>% rename(LGA = NAME), by = "LGA") %>%
  mutate(avg_brightness = ifelse(
    is.na(avg_brightness), 
    mean(df$brightness, na.rm = TRUE), 
    avg_brightness
  ))

crime_dec_2024 <- read_excel("dec_2024_lga.xlsx", sheet = "Table 02") %>%
  rename(LGA = `Local Government Area`) %>%
  left_join(brightness_by_lga %>% rename(LGA = NAME), by = "LGA") %>%
  mutate(avg_brightness = ifelse(
    is.na(avg_brightness), 
    mean(df$brightness, na.rm = TRUE), 
    avg_brightness
  ))

crime_mar_2023 <- read_excel("march_2023_lga.xlsx", sheet = "Table 02") %>%
  rename(LGA = `Local Government Area`) %>%
  left_join(brightness_by_lga %>% rename(LGA = NAME), by = "LGA") %>%
  mutate(avg_brightness = ifelse(
    is.na(avg_brightness), 
    mean(df$brightness, na.rm = TRUE), 
    avg_brightness
  ))

crime_june_2025 <- read_excel("june_2025_lga.xlsx", sheet = "Table 02") %>%
  rename(LGA = `Local Government Area`) %>%
  left_join(brightness_by_lga %>% rename(LGA = NAME), by = "LGA") %>%
  mutate(avg_brightness = ifelse(
    is.na(avg_brightness), 
    mean(df$brightness, na.rm = TRUE), 
    avg_brightness
  ))

crime_all <- bind_rows(crime_sept_2025, crime_mar_2023, crime_dec_2024)

# --- Write combined CSV ---
write.csv(crime_all, 
          "crime_with_brightness.csv", 
          row.names = FALSE)

