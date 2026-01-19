export default function isDarkColor(r, g, b) {
    // Convert sRGB to linear RGB
    const srgb = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    // Relative luminance (WCAG)
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];

    // Threshold: < 0.5 is commonly considered "dark"
    return luminance < 0.5;
}
