// ============================================
// VALIDATION DES FICHIERS - Holiday Planning
// ============================================
// Ce fichier contient les fonctions de validation pour les uploads

/**
 * Types MIME autorisés
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',   // Certains navigateurs utilisent jpg au lieu de jpeg
    'image/png',
    'application/pdf'
];

/**
 * Extensions autorisées
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

/**
 * Taille maximale par fichier (en octets)
 * 10 MB = 10 * 1024 * 1024 = 10485760 octets
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Valide un fichier avant l'upload
 * @param {File} file - Le fichier à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateFile(file) {
    // Vérifier que le fichier existe
    if (!file) {
        return {
            valid: false,
            error: 'Aucun fichier sélectionné'
        };
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Type de fichier non autorisé. Formats acceptés : JPEG, PNG, PDF (fichier: ${file.name})`
        };
    }

    // Vérifier l'extension du fichier
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        return {
            valid: false,
            error: `Extension de fichier non autorisée. Extensions acceptées : .jpg, .jpeg, .png, .pdf (fichier: ${file.name})`
        };
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return {
            valid: false,
            error: `Fichier trop volumineux (${sizeMB} MB). Taille maximale : ${maxSizeMB} MB (fichier: ${file.name})`
        };
    }

    // Fichier valide
    return {
        valid: true,
        error: null
    };
}

/**
 * Valide plusieurs fichiers
 * @param {FileList|Array} files - Liste de fichiers à valider
 * @returns {Object} - { valid: boolean, errors: Array, validFiles: Array }
 */
function validateFiles(files) {
    const errors = [];
    const validFiles = [];

    for (const file of files) {
        const result = validateFile(file);

        if (result.valid) {
            validFiles.push(file);
        } else {
            errors.push(result.error);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        validFiles
    };
}

/**
 * Formate la taille d'un fichier en format lisible
 * @param {number} bytes - Taille en octets
 * @returns {string} - Taille formatée (ex: "2.5 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Récupère l'icône appropriée selon le type de fichier
 * @param {string} mimeType - Type MIME du fichier
 * @returns {string} - Emoji ou icône
 */
function getFileIcon(mimeType) {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    return '📎';
}

/**
 * Exemple d'utilisation dans le gestionnaire de fichiers
 */
function handleFilesExample(files) {
    // Valider les fichiers
    const validation = validateFiles(files);

    // Afficher les erreurs s'il y en a
    if (!validation.valid) {
        alert('Erreurs de validation :\n\n' + validation.errors.join('\n'));
        return;
    }

    // Si tous les fichiers sont valides, les ajouter à la liste
    console.log(`${validation.validFiles.length} fichier(s) valide(s)`);

    // Ajouter les fichiers valides à currentAttachments
    validation.validFiles.forEach(file => {
        // Logique d'ajout ici
        console.log(`✅ Fichier valide: ${file.name} (${formatFileSize(file.size)})`);
    });
}
