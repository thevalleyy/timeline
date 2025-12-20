import { getAverageColor } from "fast-average-color-node";

/**
 * Get the average color of an image
 * @param {String} imagePath relative path of an image file
 * @returns {Object} average color object
 */
export default async function returnAverageColor(imagePath) {
    try {
        const color = await getAverageColor(imagePath);
        return color;
    } catch (error) {
        console.error(`Error getting average color for ${imagePath}:`, error);
        return null;
    }
}
