import os
from PIL import Image

# Define the source images and their corresponding icon names (in order)
# Assuming 3x3 grid for the first one, and roughly grid layout for others.
# Since the generation might not be perfectly aligned, we'll try to crop based on a 3x3 or similar grid.

# Configuration
INPUT_DIR = r"C:\Users\user.DESKTOP-I3ROOIB\.gemini\antigravity\brain\9003bb14-de22-4e61-a8b8-9f7e10d75d84"
OUTPUT_DIR = r"c:\Users\user.DESKTOP-I3ROOIB\Document\EvolutionGameWeb\public\icons"

# Map: Image Filename -> List of Icon Names (Row by Row, Left to Right)
# Note: The filenames below need to be updated with the actual timestamps from the generation step.
# I will use the most recent files matching the pattern.

ICON_SETS = {
    "micro_sea_icons": [
        "start", "bacteria", "jellyfish",
        "starfish", "snail", "octopus",
        "fish", "axolotl", "whale"
    ],
    "land_air_icons": [
        "insect", "amphibian", "reptile",
        "bird", "eagle", "penguin",
        "bat", None, None # 7 icons, so last 2 might be empty or we just take first 7
    ],
    "mammal_icons": [
        "mammal", "platypus", "horse",
        "panda", "dog", "cat",
        "human", None, None # 7 icons
    ]
}

def get_latest_file(base_name):
    files = [f for f in os.listdir(INPUT_DIR) if f.startswith(base_name) and f.endswith(".png")]
    if not files:
        return None
    files.sort(reverse=True) # Latest first
    return os.path.join(INPUT_DIR, files[0])

def split_image(image_path, icon_names):
    if not image_path:
        print(f"Image not found for set")
        return

    try:
        img = Image.open(image_path)
        width, height = img.size
        
        # Assuming 3x3 grid
        rows = 3
        cols = 3
        cell_width = width // cols
        cell_height = height // rows

        count = 0
        for r in range(rows):
            for c in range(cols):
                if count >= len(icon_names):
                    break
                
                icon_name = icon_names[count]
                if icon_name:
                    left = c * cell_width
                    top = r * cell_height
                    right = left + cell_width
                    bottom = top + cell_height

                    # Crop
                    icon = img.crop((left, top, right, bottom))
                    
                    # Save
                    save_path = os.path.join(OUTPUT_DIR, f"{icon_name}.png")
                    icon.save(save_path)
                    print(f"Saved {save_path}")
                
                count += 1
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for base_name, names in ICON_SETS.items():
        file_path = get_latest_file(base_name)
        print(f"Processing {base_name} from {file_path}...")
        split_image(file_path, names)

if __name__ == "__main__":
    main()
