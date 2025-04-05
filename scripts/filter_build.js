const { promises: fs } = require('fs');
const path = require('path');

const LINE_BREAK = '\n';
const COMMENT_MARKER = '!';
const EXCEPTION_MARKER = '@@';
const DNS_REWRITE = '$dnsrewrite=';
const DNS_REWRITE_RULE = 'block.noteapp.icu';

// Regex buat validasi domain (wajib diawali huruf/angka & punya TLD)
const VALID_DOMAIN_REGEX = /^(?:\|\|)?(?::\/\/)?([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})\^?$/;

/**
 * Path to the filter file
 * @type {string}
 */
const filterPath = path.resolve(process.argv[2]);

/**
 * Returns a file content.
 * @param {string} filePath Path to the file.
 * @returns {Promise<string>} - Promise resolving to the file content.
 */
const getFileContent = async (filePath) => {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        throw new Error(`Error reading file '${filePath}': ${error.message}`);
    }
};

/**
 * Function to clean and normalize domain rules
 * @param {string} line - The line to clean
 * @returns {string | null} - Cleaned domain rule or null if invalid
 */
const cleanDomainRule = (line) => {
    const match = line.match(VALID_DOMAIN_REGEX);
    if (match) {
        return `||${match[1]}^`; // Tambahin `||` kalau belum ada
    }
    return null;
};

/**
 * Function to convert the filter list by modifying each rule
 * @param {string} filePath - Path to the filter file
 * @returns {Promise<void>} - Promise resolved when the file is successfully converted
 */
const convertFilterList = async (filePath) => {
    try {
        const fileContent = await getFileContent(filePath);
        const modifiedContent = fileContent
            .split(LINE_BREAK)
            .map((line) => {
                // Kalau komentar, rule pengecualian, atau sudah ada dnsrewrite, biarkan aja
                if (
                    line.startsWith(COMMENT_MARKER) ||
                    line.includes(DNS_REWRITE) ||
                    line.startsWith(EXCEPTION_MARKER)
                ) {
                    return line;
                }

                // Cek kalau domain valid, tambahin `||`
                const cleanedLine = cleanDomainRule(line);
                if (cleanedLine) {
                    return `${cleanedLine}${DNS_REWRITE}${DNS_REWRITE_RULE}`;
                }

                return line; // Biarkan tanpa perubahan kalau bukan domain valid
            })
            .join(LINE_BREAK);

        await fs.writeFile(filePath, modifiedContent);
    } catch (error) {
        throw new Error(`Error during rules conversion: ${error.message}`);
    }
};

// Call the function to convert the filter list
convertFilterList(filterPath);
