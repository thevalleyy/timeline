/**
 * Convert hex color to RGB color object
 * @param {String} hex Hex color
 * @returns {Object} RGB color object with values between 0 and 1
 */
export default function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;

    return { r, g, b };
}
