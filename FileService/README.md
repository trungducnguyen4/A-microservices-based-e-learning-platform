# FileService

File management service for the microservices-based e-learning platform.

## Features

- **Single and Multiple File Uploads**: Support for uploading one or multiple files
- **File Serving**: Direct file access via URLs with proper MIME types
- **File Downloads**: Forced download with appropriate headers
- **Image Processing**: Automatic thumbnail generation for images using Sharp
- **File Type Validation**: Configurable allowed file types
- **File Size Limits**: Configurable maximum file size per upload
- **File Management**: List, delete, and get file information
- **Security**: File type validation and size limits
- **Performance**: Caching headers and efficient file streaming
- **Organized Storage**: Files organized by type in subdirectories

## Directory Structure

```
FileService/
├── package.json
├── server.js
├── .env
├── .gitignore
├── README.md
└── uploads/           (created automatically)
    ├── assignments/
    ├── course-materials/
    ├── profile-images/
    ├── videos/
    ├── documents/
    ├── thumbnails/
    └── temp/
```

## API Endpoints

### File Upload
- **POST /upload** - Upload single file
  ```javascript
  // FormData with 'file' field
  // Optional: fileType in body (assignments, course-materials, profile-images, videos, documents)
  ```

- **POST /upload-multiple** - Upload multiple files
  ```javascript
  // FormData with 'files[]' field (max 10 files)
  // Optional: fileType in body
  ```

### File Access
- **GET /file/:filename** - Serve file with proper MIME type
- **GET /download/:filename** - Download file with attachment headers
- **GET /thumbnail/:filename** - Get image thumbnail (300x300)

### File Management
- **GET /info/:filename** - Get file information (size, type, dates)
- **DELETE /delete/:filename** - Delete file and its thumbnail
- **GET /list/:fileType?** - List files by type with pagination
  ```
  Query params: page (default: 1), limit (default: 20)
  ```

### System
- **GET /health** - Service health check and configuration info

## Environment Variables

Create a `.env` file in the FileService directory:

```env
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/mp4,video/avi,video/mov
NODE_ENV=development
```

## Installation and Setup

1. **Navigate to FileService directory:**
   ```bash
   cd FileService
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the service:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Verify service is running:**
   ```bash
   curl http://localhost:5000/health
   ```

## Usage Examples

### Upload a single file
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fileType', 'assignments'); // optional

const response = await fetch('http://localhost:5000/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.result.url); // /file/uuid.ext
```

### Upload multiple files
```javascript
const formData = new FormData();
for (let file of fileInput.files) {
  formData.append('files', file);
}
formData.append('fileType', 'course-materials');

const response = await fetch('http://localhost:5000/upload-multiple', {
  method: 'POST',
  body: formData
});
```

### Get file information
```javascript
const response = await fetch('http://localhost:5000/info/filename.pdf');
const fileInfo = await response.json();
```

### List files with pagination
```javascript
const response = await fetch('http://localhost:5000/list/assignments?page=1&limit=10');
const files = await response.json();
```

## File Types

The service organizes files into these categories:
- **assignments**: Student assignments and submissions
- **course-materials**: Course content, slides, resources
- **profile-images**: User profile pictures
- **videos**: Video lectures and content
- **documents**: General documents and files

## Security Features

- File type validation based on MIME types
- Configurable file size limits
- Unique filename generation to prevent conflicts
- No directory traversal vulnerabilities
- Proper error handling and logging

## Integration with E-Learning Platform

This FileService integrates seamlessly with your existing microservices:
- **UserService** (port 8080): For user authentication
- **ClassroomService** (port 3636): For classroom materials
- **HomeworkService**: For assignment submissions
- **ScheduleService**: For schedule-related documents

The service can be called from your React frontend components like StudentPortal, TeacherDashboard, etc.

## Performance Features

- Efficient file streaming
- Automatic thumbnail generation for images
- Caching headers for better performance
- Organized file storage for quick access
- Pagination for large file lists

## Monitoring and Logging

The service provides:
- Health check endpoint for monitoring
- Console logging for debugging
- Error tracking and reporting
- Service status information