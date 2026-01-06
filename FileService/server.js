import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs-extra";
import mime from "mime-types";
import sharp from "sharp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Middleware
// Enable CORS only when explicitly configured. In production when routed through the API Gateway
// the gateway will handle CORS headers. Setting ENABLE_CORS=true will enable CORS on the FileService
// (useful when calling the service directly during testing).
if (process.env.ENABLE_CORS === 'true') {
  app.use(cors());
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = [
    path.join(UPLOAD_DIR, 'assignments'),
    path.join(UPLOAD_DIR, 'course-materials'),
    path.join(UPLOAD_DIR, 'profile-images'),
    path.join(UPLOAD_DIR, 'videos'),
    path.join(UPLOAD_DIR, 'documents'),
    path.join(UPLOAD_DIR, 'thumbnails'),
    path.join(UPLOAD_DIR, 'temp')
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// File size limit helper
const getFileSizeLimit = () => {
  const maxSize = process.env.MAX_FILE_SIZE || "50MB";
  const sizeMap = {
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  const match = maxSize.match(/^(\d+)(KB|MB|GB)$/i);
  if (match) {
    return parseInt(match[1]) * sizeMap[match[2].toUpperCase()];
  }
  return 50 * 1024 * 1024; // Default 50MB
};

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [];
  
  if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType || 'documents';
    const uploadPath = path.join(UPLOAD_DIR, fileType);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: getFileSizeLimit()
  },
  fileFilter: fileFilter
});

// Helper function to get file info
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    return {
      size: stats.size,
      mimeType: mimeType,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isImage: mimeType.startsWith('image/'),
      isVideo: mimeType.startsWith('video/'),
      isDocument: mimeType.startsWith('application/') || mimeType.startsWith('text/')
    };
  } catch (error) {
    throw new Error('File not found');
  }
};

// API Routes

// Serve test interface
app.get('/test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'test', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FileService',
    timestamp: new Date().toISOString(),
    uploadDir: UPLOAD_DIR,
    maxFileSize: process.env.MAX_FILE_SIZE
  });
});

// Upload single file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: 'No file uploaded'
      });
    }

    const fileInfo = await getFileInfo(req.file.path);
    
    // Generate thumbnail for images
    let thumbnailPath = null;
    if (fileInfo.isImage) {
      try {
        const thumbnailDir = path.join(UPLOAD_DIR, 'thumbnails');
        await fs.ensureDir(thumbnailDir);
        
        const thumbnailName = `thumb_${req.file.filename}`;
        thumbnailPath = path.join(thumbnailDir, thumbnailName);
        
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (thumbnailError) {
        console.warn('Failed to generate thumbnail:', thumbnailError.message);
      }
    }

    const response = {
      code: 200,
      message: 'File uploaded successfully',
      result: {
        fileId: path.parse(req.file.filename).name,
        id: path.parse(req.file.filename).name,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        fileType: req.body.fileType || 'documents',
        uploadedAt: new Date().toISOString(),
        thumbnailPath: thumbnailPath ? path.relative(UPLOAD_DIR, thumbnailPath) : null,
        url: `/file/${req.file.filename}`,
        downloadUrl: `/download/${req.file.filename}`
        ,
        // Echo back any metadata fields sent with the upload (homeworkId, studentId, etc.)
        metadata: Object.keys(req.body || {}).length > 0 ? { ...req.body } : null
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || 'Failed to upload file'
    });
  }
});

// Upload multiple files
app.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileInfo = await getFileInfo(file.path);
      
      // Generate thumbnail for images
      let thumbnailPath = null;
      if (fileInfo.isImage) {
        try {
          const thumbnailDir = path.join(UPLOAD_DIR, 'thumbnails');
          await fs.ensureDir(thumbnailDir);
          
          const thumbnailName = `thumb_${file.filename}`;
          thumbnailPath = path.join(thumbnailDir, thumbnailName);
          
          await sharp(file.path)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        } catch (thumbnailError) {
          console.warn('Failed to generate thumbnail:', thumbnailError.message);
        }
      }

      uploadedFiles.push({
          fileId: path.parse(file.filename).name,
          id: path.parse(file.filename).name,
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        fileType: req.body.fileType || 'documents',
        uploadedAt: new Date().toISOString(),
        thumbnailPath: thumbnailPath ? path.relative(UPLOAD_DIR, thumbnailPath) : null,
        url: `/file/${file.filename}`,
        downloadUrl: `/download/${file.filename}`
          ,
          metadata: Object.keys(req.body || {}).length > 0 ? { ...req.body } : null
      });
    }

    res.json({
      code: 200,
      message: `${uploadedFiles.length} files uploaded successfully`,
      result: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || 'Failed to upload files'
    });
  }
});

// Get file (serve file)
app.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find file in all subdirectories
    const searchDirs = ['assignments', 'course-materials', 'profile-images', 'videos', 'documents'];
    let filePath = null;

    for (const dir of searchDirs) {
      const testPath = path.join(UPLOAD_DIR, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        code: 404,
        message: 'File not found'
      });
    }

    const fileInfo = await getFileInfo(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileInfo.size);
    
    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=31557600'); // 1 year
    res.setHeader('ETag', `"${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to serve file'
    });
  }
});

// Download file
app.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find file in all subdirectories
    const searchDirs = ['assignments', 'course-materials', 'profile-images', 'videos', 'documents'];
    let filePath = null;
    let originalName = filename;

    for (const dir of searchDirs) {
      const testPath = path.join(UPLOAD_DIR, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        code: 404,
        message: 'File not found'
      });
    }

    const fileInfo = await getFileInfo(filePath);
    
    // Set download headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Length', fileInfo.size);

    // Stream the file for download
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to download file'
    });
  }
});

// Get file info
app.get('/info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find file in all subdirectories
    const searchDirs = ['assignments', 'course-materials', 'profile-images', 'videos', 'documents'];
    let filePath = null;

    for (const dir of searchDirs) {
      const testPath = path.join(UPLOAD_DIR, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        code: 404,
        message: 'File not found'
      });
    }

    const fileInfo = await getFileInfo(filePath);
    
    res.json({
      code: 200,
      message: 'File info retrieved successfully',
      result: {
        filename,
        ...fileInfo,
        url: `/file/${filename}`,
        downloadUrl: `/download/${filename}`
      }
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to get file info'
    });
  }
});

// Delete file
app.delete('/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find file in all subdirectories
    const searchDirs = ['assignments', 'course-materials', 'profile-images', 'videos', 'documents'];
    let filePath = null;

    for (const dir of searchDirs) {
      const testPath = path.join(UPLOAD_DIR, dir, filename);
      if (await fs.pathExists(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        code: 404,
        message: 'File not found'
      });
    }

    // Delete the file
    await fs.remove(filePath);
    
    // Also delete thumbnail if exists
    const thumbnailPath = path.join(UPLOAD_DIR, 'thumbnails', `thumb_${filename}`);
    if (await fs.pathExists(thumbnailPath)) {
      await fs.remove(thumbnailPath);
    }

    res.json({
      code: 200,
      message: 'File deleted successfully',
      result: { filename }
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to delete file'
    });
  }
});

// List files by type
app.get('/list/:fileType?', async (req, res) => {
  try {
    const { fileType = 'documents' } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const dirPath = path.join(UPLOAD_DIR, fileType);
    
    if (!await fs.pathExists(dirPath)) {
      return res.json({
        code: 200,
        message: 'No files found',
        result: {
          files: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    const files = await fs.readdir(dirPath);
    const total = files.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedFiles = files.slice(startIndex, endIndex);
    
    const fileInfos = await Promise.all(
      paginatedFiles.map(async (filename) => {
        const filePath = path.join(dirPath, filename);
        const fileInfo = await getFileInfo(filePath);
        
        return {
          filename,
          ...fileInfo,
          url: `/file/${filename}`,
          downloadUrl: `/download/${filename}`
        };
      })
    );

    res.json({
      code: 200,
      message: 'Files retrieved successfully',
      result: {
        files: fileInfos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to list files'
    });
  }
});

// Get thumbnail
app.get('/thumbnail/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnailPath = path.join(UPLOAD_DIR, 'thumbnails', `thumb_${filename}`);
    
    if (!await fs.pathExists(thumbnailPath)) {
      return res.status(404).json({
        code: 404,
        message: 'Thumbnail not found'
      });
    }

    const fileInfo = await getFileInfo(thumbnailPath);
    
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileInfo.size);
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    
    const fileStream = fs.createReadStream(thumbnailPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to serve thumbnail'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE || '50MB'}`
      });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    code: 500,
    message: error.message || 'Internal server error'
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    await ensureDirectories();
    
    app.listen(PORT, () => {
      console.log(`FileService running at https://localhost:${PORT}`);
      console.log(`Upload directory: ${UPLOAD_DIR}`);
      console.log(`Max file size: ${process.env.MAX_FILE_SIZE || '50MB'}`);
      console.log('Available endpoints:');
      console.log('  GET /health - Health check');
      console.log('  POST /upload - Upload single file');
      console.log('  POST /upload-multiple - Upload multiple files');
      console.log('  GET /file/:filename - Serve file');
      console.log('  GET /download/:filename - Download file');
      console.log('  GET /info/:filename - Get file info');
      console.log('  DELETE /delete/:filename - Delete file');
      console.log('  GET /list/:fileType - List files by type');
      console.log('  GET /thumbnail/:filename - Get thumbnail');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();