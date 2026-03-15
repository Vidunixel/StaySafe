import pandas as pd

# List of your uploaded files
files = [
    'melbourne_yarra_lighting.csv', 
    'cityOfCasey_lighting.csv', 
    'ballarat_lighting.csv'
]

all_coords = []

# Loop through each file
for file in files:
    # Read the CSV file
    df = pd.read_csv(file)
    
    # Check if 'geo_point_2d' exists in the columns
    if 'geo_point_2d' in df.columns:
        # Drop any empty values
        coords = df['geo_point_2d'].dropna()
        
        for c in coords:
            try:
                # Split the string by comma and convert to float
                lat, lon = map(float, c.split(','))
                
                # Format as a list-like string and append
                all_coords.append(f"[{lat}, {lon}]")
            except Exception as e:
                # In case of formatting issues with a specific row, skip it
                pass

# Create a new DataFrame with just the one column
out_df = pd.DataFrame({'geo_coordinates': all_coords})

# Write to the new CSV
out_df.to_csv('combined_coordinates.csv', index=False)

print(f"Successfully saved {len(out_df)} coordinates to combined_coordinates.csv")
