from cairosvg import svg2png
import os

# Sizes needed for the Chrome extension
sizes = [16, 48, 128]

# Read the SVG file
with open('images/icon.svg', 'rb') as svg_file:
    svg_data = svg_file.read()

# Convert to different sizes
for size in sizes:
    output_file = f'images/icon{size}.png'
    svg2png(bytestring=svg_data,
            write_to=output_file,
            output_width=size,
            output_height=size)

print("Icon files have been created successfully!") 