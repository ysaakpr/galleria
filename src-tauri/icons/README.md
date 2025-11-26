# App Icons

Place your app icons in this directory:

- `32x32.png` - 32x32 pixels
- `128x128.png` - 128x128 pixels
- `128x128@2x.png` - 256x256 pixels (Retina)
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon

You can generate these icons from a single high-resolution image (1024x1024 or larger) using tools like:
- https://icon.kitchen/
- https://www.appicon.co/
- Tauri Icon plugin: `cargo tauri icon path/to/icon.png`

## Using Tauri Icon Generator

```bash
# Install the Tauri CLI plugin (if not already installed)
cargo install tauri-cli

# Generate all icon sizes from a single source image
cargo tauri icon path/to/your-icon.png
```

This will automatically generate all required icon sizes and formats.

