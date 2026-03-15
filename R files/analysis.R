library(dplyr)
library(stringr)
library(lightgbm)

crime = read.csv("crime_with_brightness.csv", header = TRUE)

View(crime)

crime <- crime %>%
  rename(Month = Year.ending)

#crime <- crime %>%
 # mutate(total_count = coalesce(Incidents.Recorded, Offence.Count)) %>%
  #select(-Incidents.Recorded, -Offence.Count)

View(crime)

#If total count is used, replace offence count with total_count
crime <- crime %>%
  mutate(population_est = (Offence.Count * 100000) / LGA.Rate.per.100.000.population)

View(crime)

crime <- crime %>%
  mutate(
    LGA_code   = as.integer(factor(LGA)),    # LGA as categorical
    Month_code = as.integer(factor(Month)),
    Offence_code = as.integer(factor(Offence.Subgroup))# Month as categorical
  )

View(crime)

train_matrix <- as.matrix(crime %>% select(Year, avg_brightness, LGA_code, Month_code, Offence_code))

# LightGBM dataset
dtrain <- lgb.Dataset(
  data = train_matrix,
  label = crime$Offence.Count,
  categorical_feature = c("LGA_code", "Month_code", "Offence_code")
)

# Training parameters
params <- list(
  objective = "regression",
  metric = "rmse",
  learning_rate = 0.1,
  num_leaves = 31,
  verbose = -1
)

# Train the model
model <- lgb.train(
  params = params,
  data = dtrain,
  nrounds = 500
)

# Get feature importance
importance <- lgb.importance(model)
print(importance)

march2026_data = crime

march2026_data$Year = 2026
march2026_data$Month = "March"

march2026_data <- march2026_data %>%
  mutate(
    LGA_code   = as.integer(factor(LGA, levels = levels(factor(crime$LGA)))),
    Month_code = as.integer(factor(Month, levels = levels(factor(crime$Month)))),
    Offence_code = as.integer(factor(Offence.Subgroup, levels = levels(factor(crime$Offence.Subgroup))))
  )

test_matrix <- as.matrix(march2026_data %>% select(Year, avg_brightness, LGA_code, Month_code, Offence_code))

march2026_data$predicted_total_count <- predict(model, test_matrix)

march2026_data$predicted_LGA_rate_per_100k <- (march2026_data$predicted_total_count / march2026_data$population_est) * 100000

march2026_data[is.na(march2026_data)] <- 0
march2026_data <- pmax(march2026_data, 0)
march2026_data$predicted_total_count <- ceiling(march2026_data$predicted_total_count)

View(march2026_data)

suburb_summary <- march2026_data %>%
  group_by(LGA) %>%
  summarise(
    total_pred_count = sum(predicted_total_count, na.rm = TRUE),
    avg_rate_per_100k = median(predicted_LGA_rate_per_100k, na.rm = TRUE)
  ) 

View(suburb_summary)


write.csv(suburb_summary[, c("LGA", "avg_rate_per_100k")],
          file = "LGA_predictions_march2026.csv",
          row.names = FALSE)

