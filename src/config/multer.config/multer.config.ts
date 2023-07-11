import multer from 'multer';
import { extname } from 'path';

export const multerConfig = {
    storage: multer.diskStorage({
        destination: './uploads', // Specify the destination folder for uploaded images
        filename: (req, file, callback) => {
            const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
            callback(null, `${randomName}${extname(file.originalname)}`);
        },
    }),
};

export const upload = multer(multerConfig);
