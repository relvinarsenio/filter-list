const { promises: fs, createReadStream, createWriteStream } = require('fs');
const readline = require('readline');
const path = require('path');

// Konstanta
const COMMENT_MARKER = '!';
const EXCEPTION_MARKER = '@@';
const DNS_REWRITE = '$dnsrewrite=';
const DNS_REWRITE_RULE = 'block.noteapp.icu';

// Regex untuk mendeteksi domain valid dalam filter AdGuard
const VALID_DOMAIN_REGEX = /^(?:\|\||\:\/\/)?([a-z0-9][-a-z0-9.*]*(?:\.[-a-z0-9.*]+)*\.[a-z]{2,})(?:\^)?$/i;

/**
 * Path to the filter file
 * @type {string}
 */
const filterPath = path.resolve(process.argv[2]);

/**
 * Function to clean and normalize domain rules
 * @param {string} line - The line to clean
 * @returns {string} - Original line or line with added dnsrewrite
 */
const cleanDomainRule = (line) => {
    // Skip lines that are comments, exceptions, or already have dnsrewrite
    const trimmedLine = line.trim();
    if (trimmedLine === '' || 
        trimmedLine.startsWith(COMMENT_MARKER) || 
        trimmedLine.startsWith(EXCEPTION_MARKER) ||
        trimmedLine.includes(DNS_REWRITE)) {
        return line;
    }
    
    // Check if it's a valid domain rule
    const match = VALID_DOMAIN_REGEX.exec(trimmedLine);
    if (match) {
        // If it doesn't start with || and doesn't end with ^, format it properly
        if (!trimmedLine.startsWith('||')) {
            return `||${match[1]}^${DNS_REWRITE}${DNS_REWRITE_RULE}`;
        }
        // If it has || but no ^, add ^ and DNS rewrite
        if (!trimmedLine.endsWith('^')) {
            return `${trimmedLine}^${DNS_REWRITE}${DNS_REWRITE_RULE}`;
        }
        // If it's already in the format ||domain^, just add DNS rewrite
        return `${trimmedLine}${DNS_REWRITE}${DNS_REWRITE_RULE}`;
    }
    
    return line; // Return original line if it's not a valid domain
};

/**
 * Processes a filter file using streams for better memory efficiency
 * @param {string} filePath - Path to the filter file
 * @returns {Promise<void>}
 */
const convertFilterListStream = async (filePath) => {
    const tempPath = `${filePath}.temp`;
    
    try {
        // Buat stream untuk membaca dan menulis
        const readStream = createReadStream(filePath, { encoding: 'utf-8' });
        const writeStream = createWriteStream(tempPath);
        
        const rl = readline.createInterface({
            input: readStream,
            crlfDelay: Infinity
        });
        
        for await (const line of rl) {
            const processedLine = cleanDomainRule(line);
            writeStream.write(processedLine + '\n');
        }
        
        // Tutup writeStream dan tunggu sampai selesai
        writeStream.end();
        await new Promise(resolve => writeStream.on('finish', resolve));
        
        // Ganti file asli dengan file yang sudah diproses
        await fs.rename(tempPath, filePath);
        
    } catch (error) {
        // Hapus file sementara jika terjadi error
        try {
            await fs.unlink(tempPath);
        } catch (unlinkError) {
            // Abaikan error saat menghapus file sementara
        }
        throw new Error(`Error during rules conversion: ${error.message}`);
    }
};

/**
 * Proses file dengan membaca seluruh konten sekaligus (untuk file kecil)
 * @param {string} filePath - Path to the filter file
 * @returns {Promise<void>}
 */
const convertFilterListInMemory = async (filePath) => {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const modifiedContent = fileContent
            .split('\n')
            .map(cleanDomainRule)
            .join('\n');
        
        await fs.writeFile(filePath, modifiedContent);
    } catch (error) {
        throw new Error(`Error during rules conversion: ${error.message}`);
    }
};

/**
 * Determines the best method to process the file based on its size
 * @param {string} filePath - Path to the filter file
 * @returns {Promise<void>}
 */
const convertFilterList = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        // Gunakan streaming untuk file besar (> 10MB)
        if (fileSizeInMB > 10) {
            await convertFilterListStream(filePath);
        } else {
            await convertFilterListInMemory(filePath);
        }
        
        console.log(`Filter list successfully converted: ${filePath}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Call the function with the file path
convertFilterList(filterPath);
