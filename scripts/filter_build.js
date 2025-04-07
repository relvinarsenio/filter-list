const { promises: fs, createReadStream, createWriteStream } = require('fs');
const readline = require('readline');
const path = require('path');

// Konstanta
const COMMENT_MARKER = '!';
const EXCEPTION_MARKER = '@@';
const DNS_REWRITE = '$dnsrewrite=';
const DNS_REWRITE_RULE = 'block.noteapp.icu';

// Pre-compile regex untuk kinerja yang lebih baik
const VALID_DOMAIN_REGEX = /^(?:\|\|)?(?::\/\/)?([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})\^?$/;

/**
 * Path to the filter file
 * @type {string}
 */
const filterPath = path.resolve(process.argv[2]);

/**
 * Function to clean and normalize domain rules
 * @param {string} line - The line to clean
 * @returns {string | null} - Cleaned domain rule or null if invalid
 */
const cleanDomainRule = (line) => {
    // Optimasi: Cek kondisi yang paling cepat dulu
    if (line.startsWith(COMMENT_MARKER) || 
        line.includes(DNS_REWRITE) || 
        line.startsWith(EXCEPTION_MARKER) ||
        line.trim() === '') {
        return line; // Kembalikan tanpa modifikasi
    }
    
    const match = VALID_DOMAIN_REGEX.exec(line);
    if (match) {
        return `||${match[1]}^${DNS_REWRITE}${DNS_REWRITE_RULE}`;
    }
    return line; // Biarkan tanpa perubahan kalau bukan domain valid
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
