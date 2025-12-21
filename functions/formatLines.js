/**
 * This function attempts to interpret markdown syntax for **bold** and __italic__ text.
 * @param {Array} wrapped An array of strings, each element representing a line
 * @returns A 2d array with lines and formatting
 */
export default function formatLines(wrapped) {
    const formatted = [];
    let b = false;
    let i = false;
    let previous = {};
    let currentLine = 0;

    for (let n = 0; n < wrapped.length; n++) {
        formatted[n] = [];
        const line = wrapped[n];

        // go through every word and check for syntax
        line.split(" ").forEach((word) => {
            if (word.startsWith("**")) {
                b = true;
                word = word.replace("**", "");
            }
            if (word.startsWith("__")) {
                i = true;
                word = word.replace("__", "");
            }

            // push word and options to array
            if (previous.b == b && previous.i == i && currentLine == n) {
                // formatting didn't change, append to existing string
                formatted[n][formatted[n].length - 1][0] = `${formatted[n][formatted[n].length - 1][0]} ${word.replace("**", "").replace("__", "")}`;
            } else {
                currentLine = n;
                formatted[n].push([word.replace("**", "").replace("__", ""), { b, i }]);
            }

            previous = { b, i };

            if (word.includes("**")) b = false;
            if (word.includes("__")) i = false;
        });
    }

    return formatted;
}
