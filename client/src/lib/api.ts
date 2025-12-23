import axios from 'axios';

// API Base URLs - All requests go through API Gateway
// Use Vite env var when available (VITE_API_BASE), otherwise default to localhost
const API_GATEWAY_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? 'http://localhost:8888/api';
const HOMEWORK_API_BASE = API_GATEWAY_BASE;
const FILE_API_BASE = API_GATEWAY_BASE;

// Create axios instances
export const homeworkApi = axios.create({
  baseURL: HOMEWORK_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fileApi = axios.create({
  baseURL: FILE_API_BASE,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add request interceptors to include JWT token
const addAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(homeworkApi);
addAuthInterceptor(fileApi);

// Homework API Types
export interface HomeworkCreationRequest {
  title: string;
  description: string;
  courseId: string;
  classId?: string;
  assignedStudentIds?: string[];
  dueDate: string;
  maxScore: number;
  submissionType: 'TEXT' | 'FILE' | 'BOTH';
  instructions?: string;
  allowLateSubmissions?: boolean;
  resubmissionAllowed?: boolean;
  maxAttempts?: number;
  estimatedDurationMinutes?: number;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  tags?: string[];
}

export interface HomeworkUpdateRequest extends Partial<HomeworkCreationRequest> {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface SubmissionCreationRequest {
  homeworkId: string;
  studentId: string;
  content?: string;
  attachmentIds?: string[];
}

export interface GradingRequest {
  gradedBy: string;
  score: number;
  feedback?: string;
  privateNotes?: string;
}

// File API Types
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
  uploadedAt: string;
}

// Homework API Functions
export const homeworkService = {
  // Homework CRUD
  createHomework: async (data: HomeworkCreationRequest) => {
    const response = await homeworkApi.post('/homework', data);
    return response.data;
  },

  updateHomework: async (id: string, data: HomeworkUpdateRequest) => {
    const response = await homeworkApi.put(`/homework/${id}`, data);
    return response.data;
  },

  getHomework: async (id: string) => {
    const response = await homeworkApi.get(`/homework/${id}`);
    return response.data;
  },

  deleteHomework: async (id: string) => {
    const response = await homeworkApi.delete(`/homework/${id}`);
    return response.data;
  },

  publishHomework: async (id: string) => {
    const response = await homeworkApi.post(`/homework/${id}/publish`);
    return response.data;
  },

  // Homework queries
  getHomeworksByCourse: async (courseId: string, page = 0, size = 10) => {
    const response = await homeworkApi.get(`/homework/course/${courseId}?page=${page}&size=${size}`);
    return response.data;
  },

  getHomeworksByTeacher: async (teacherId: string, page = 0, size = 10) => {
    const response = await homeworkApi.get(`/homework/teacher/${teacherId}?page=${page}&size=${size}`);
    return response.data;
  },

  searchHomeworks: async (keyword: string, page = 0, size = 10) => {
    const response = await homeworkApi.get(`/homework/search?keyword=${keyword}&page=${page}&size=${size}`);
    return response.data;
  },

  getActiveHomeworksForStudent: async (studentId: string) => {
    const response = await homeworkApi.get(`/homework/student/${studentId}/active`);
    return response.data;
  },

  getOverdueHomeworks: async (courseId: string) => {
    const response = await homeworkApi.get(`/homework/course/${courseId}/overdue`);
    return response.data;
  },

  getHomeworkStats: async (courseId: string) => {
    const response = await homeworkApi.get(`/homework/course/${courseId}/stats`);
    return response.data;
  },

  // Additional methods for student view
  getAllHomework: async (page = 0, size = 100) => {
    const response = await homeworkApi.get(`/homework?page=${page}&size=${size}`);
    return response.data;
  },

  getStudentHomework: async (studentId: string) => {
    const response = await homeworkApi.get(`/homework/student/${studentId}`);
    return response.data;
  },
};

// Submission API Functions
export const submissionService = {
  createSubmission: async (data: SubmissionCreationRequest) => {
    const response = await homeworkApi.post('/submission', data);
    return response.data;
  },

  gradeSubmission: async (id: string, data: GradingRequest) => {
    const response = await homeworkApi.post(`/submission/${id}/grade`, data);
    return response.data;
  },

  getSubmission: async (id: string) => {
    const response = await homeworkApi.get(`/submission/${id}`);
    return response.data;
  },

  getSubmissionsByHomework: async (homeworkId: string, page = 0, size = 10) => {
    const response = await homeworkApi.get(`/submission/homework/${homeworkId}?page=${page}&size=${size}`);
    return response.data;
  },

  getSubmissionsByStudent: async (studentId: string, page = 0, size = 10) => {
    const response = await homeworkApi.get(`/submission/student/${studentId}?page=${page}&size=${size}`);
    return response.data;
  },

  getPendingSubmissions: async (homeworkId: string) => {
    const response = await homeworkApi.get(`/submission/homework/${homeworkId}/pending`);
    return response.data;
  },

  getLatestSubmission: async (homeworkId: string, studentId: string) => {
    const response = await homeworkApi.get(`/submission/homework/${homeworkId}/student/${studentId}/latest`);
    return response.data;
  },

  getSubmissionStats: async (homeworkId: string) => {
    const response = await homeworkApi.get(`/submission/homework/${homeworkId}/stats`);
    return response.data;
  },

  deleteSubmission: async (id: string) => {
    const response = await homeworkApi.delete(`/submission/${id}`);
    return response.data;
  },
};

// File API Functions
export const fileService = {
  uploadFile: async (file: File, metadata?: any): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    // FileService expects fields like 'fileType' or other metadata as form fields
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        // normalize common key name
        if (key === 'type') {
          formData.append('fileType', metadata[key]);
        } else {
          formData.append(key, metadata[key]);
        }
      });
    }

    const response = await fileApi.post('/files/upload', formData);

    // Normalize FileService response: { code, message, result: { fileId, originalName, filename, ... } }
    const data = response.data;
    const result = data?.result || data;

    if (!result) return result;

    // Normalize returned URL: if FileService returns a relative path like `/file/uuid.ext`,
    // convert it to a gateway-served absolute path: <API_BASE>/files/file/uuid.ext
    let rawUrl = result.url || result.downloadUrl;
    if (typeof rawUrl === 'string' && rawUrl.startsWith('/')) {
      const base = (import.meta as any)?.env?.VITE_API_BASE ?? API_GATEWAY_BASE;
      rawUrl = base.replace(/\/$/, '') + '/files' + rawUrl;
    }

    return {
      id: result.fileId || result.id || result.filename?.split('.')[0],
      filename: result.filename,
      originalName: result.originalName || result.originalname || result.filename,
      size: result.size,
      mimetype: result.mimeType || result.mimetype,
      path: result.path,
      url: rawUrl,
      uploadedAt: result.uploadedAt,
    } as unknown as FileUploadResponse;
  },

  uploadMultipleFiles: async (files: File[], metadata?: any): Promise<FileUploadResponse[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        if (key === 'type') {
          formData.append('fileType', metadata[key]);
        } else {
          formData.append(key, metadata[key]);
        }
      });
    }

    const response = await fileApi.post('/files/upload-multiple', formData);
    const data = response.data;
    const results = data?.result || [];

    return results.map((r: any) => {
      let rawUrl = r.url || r.downloadUrl;
      if (typeof rawUrl === 'string' && rawUrl.startsWith('/')) {
        const base = (import.meta as any)?.env?.VITE_API_BASE ?? API_GATEWAY_BASE;
        rawUrl = base.replace(/\/$/, '') + '/files' + rawUrl;
      }
      return {
        id: r.fileId || r.id || r.filename?.split('.')[0],
        filename: r.filename,
        originalName: r.originalName || r.originalname || r.filename,
        size: r.size,
        mimetype: r.mimeType || r.mimetype,
        path: r.path,
        url: rawUrl,
        uploadedAt: r.uploadedAt,
      };
    });
  },

  downloadFile: async (fileId: string) => {
    const response = await fileApi.get(`/files/download/${fileId}`, {
      responseType: 'blob'
    });
    return response;
  },

  getFileInfo: async (fileId: string) => {
    const response = await fileApi.get(`/files/${fileId}`);
    const data = response.data;
    const r = data?.result || data;
    if (!r) return r;

    return {
      id: r.fileId || fileId,
      filename: r.filename,
      size: r.size,
      mimeType: r.mimeType || r.mimeType,
      createdAt: r.createdAt,
      modifiedAt: r.modifiedAt,
      url: r.url,
      downloadUrl: r.downloadUrl,
    };
  },

  deleteFile: async (fileId: string) => {
    const response = await fileApi.delete(`/files/${fileId}`);
    return response.data;
  },

  listFiles: async (page = 0, limit = 20) => {
    // FileService exposes /list/:fileType - but keep a generic list that callers can adapt.
    const response = await fileApi.get(`/files/list/documents?page=${page}&limit=${limit}`);
    const data = response.data;
    const result = data?.result || { files: [] };
    return {
      ...data,
      result: {
        files: (result.files || []).map((f: any) => ({
          filename: f.filename,
          url: f.url,
          size: f.size,
          mimeType: f.mimeType || f.mimeType,
        })),
        pagination: result.pagination,
      }
    };
  },

  generateThumbnail: async (fileId: string, width = 200, height = 200) => {
    const response = await fileApi.get(`/thumbnail/${fileId}?width=${width}&height=${height}`, {
      responseType: 'blob'
    });
    return response;
  },
};

export default {
  homeworkService,
  submissionService,
  fileService,
};

// Generic API axios instance for other services (users, schedules, etc.)
export const api = axios.create({
  baseURL: API_GATEWAY_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// attach auth interceptor
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const userService = {
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/users/change-password', { oldPassword, newPassword });
    return response.data;
  }
};