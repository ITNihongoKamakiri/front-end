// Cloudinary upload service

export const uploadImageToCloudinary = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    // Cloudinary configuration
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/daku3kfyd/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'apartment_images'; // Unsigned upload preset

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        // Sử dụng XMLHttpRequest để theo dõi tiến trình upload
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Setup progress tracking
            if (onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        onProgress(percentComplete);
                    }
                };
            }

            xhr.open('POST', CLOUDINARY_URL, true);

            xhr.onload = function () {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    // Return the secure URL
                    resolve(response.secure_url);
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = function () {
                reject(new Error('Upload failed'));
            };

            xhr.send(formData);
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};