import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import {
  EasyRedmineProject,
  EasyRedmineUser,
  EasyRedmineTimeEntry,
  EasyRedmineIssue,
  EasyRedmineResponse
} from './types';

export class EasyRedmineAPI {
  private client: AxiosInstance;

  constructor() {
    // Отключаем проверку SSL сертификата глобально для этого процесса
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.client = axios.create({
      baseURL: config.easyredmine.url,
      headers: {
        'X-Redmine-API-Key': config.easyredmine.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Получить все проекты
  async getProjects(limit: number = 100, offset: number = 0): Promise<EasyRedmineResponse<EasyRedmineProject>> {
    try {
      const response = await this.client.get('/projects.json', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects');
    }
  }

  // Получить проект по ID
  async getProject(id: number): Promise<EasyRedmineProject> {
    try {
      const response = await this.client.get(`/projects/${id}.json`);
      return response.data.project;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw new Error(`Failed to fetch project ${id}`);
    }
  }

  // Получить всех пользователей
  async getUsers(limit: number = 100, offset: number = 0): Promise<EasyRedmineResponse<EasyRedmineUser>> {
    try {
      const response = await this.client.get('/users.json', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Получить пользователя по ID
  async getUser(id: number): Promise<EasyRedmineUser> {
    try {
      const response = await this.client.get(`/users/${id}.json`);
      return response.data.user;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw new Error(`Failed to fetch user ${id}`);
    }
  }

  // Получить временные записи
  async getTimeEntries(
    limit: number = 100,
    offset: number = 0,
    userId?: number,
    projectId?: number,
    from?: string,
    to?: string
  ): Promise<EasyRedmineResponse<EasyRedmineTimeEntry>> {
    try {
      const params: any = { limit, offset };
      if (userId) params.user_id = userId;
      if (projectId) params.project_id = projectId;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get('/time_entries.json', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw new Error('Failed to fetch time entries');
    }
  }

  // Получить временные записи пользователя
  async getUserTimeEntries(
    userId: number,
    limit: number = 100,
    offset: number = 0,
    from?: string,
    to?: string
  ): Promise<EasyRedmineResponse<EasyRedmineTimeEntry>> {
    return this.getTimeEntries(limit, offset, userId, undefined, from, to);
  }

  // Получить временные записи проекта
  async getProjectTimeEntries(
    projectId: number,
    limit: number = 100,
    offset: number = 0,
    from?: string,
    to?: string
  ): Promise<EasyRedmineResponse<EasyRedmineTimeEntry>> {
    return this.getTimeEntries(limit, offset, undefined, projectId, from, to);
  }

  // Получить все задачи
  async getIssues(
    limit: number = 100,
    offset: number = 0,
    projectId?: number,
    assignedToId?: number,
    statusId?: number
  ): Promise<EasyRedmineResponse<EasyRedmineIssue>> {
    try {
      const params: any = { limit, offset };
      if (projectId) params.project_id = projectId;
      if (assignedToId) params.assigned_to_id = assignedToId;
      if (statusId) params.status_id = statusId;

      const response = await this.client.get('/issues.json', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw new Error('Failed to fetch issues');
    }
  }

  // Получить задачу по ID
  async getIssue(id: number): Promise<EasyRedmineIssue> {
    try {
      const response = await this.client.get(`/issues/${id}.json`);
      return response.data.issue;
    } catch (error) {
      console.error(`Error fetching issue ${id}:`, error);
      throw new Error(`Failed to fetch issue ${id}`);
    }
  }

  // Получить задачи проекта
  async getProjectIssues(
    projectId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<EasyRedmineResponse<EasyRedmineIssue>> {
    return this.getIssues(limit, offset, projectId);
  }

  // Получить задачи пользователя
  async getUserIssues(
    assignedToId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<EasyRedmineResponse<EasyRedmineIssue>> {
    return this.getIssues(limit, offset, undefined, assignedToId);
  }

  // Получить статистику по часам пользователя
  async getUserHoursStats(
    userId: number,
    from?: string,
    to?: string
  ): Promise<{ totalHours: number; entries: EasyRedmineTimeEntry[] }> {
    try {
      const response = await this.getUserTimeEntries(userId, 1000, 0, from, to);
      const totalHours = response.data.reduce((sum, entry) => sum + entry.hours, 0);
      return { totalHours, entries: response.data };
    } catch (error) {
      console.error(`Error fetching user hours stats for user ${userId}:`, error);
      throw new Error(`Failed to fetch user hours stats for user ${userId}`);
    }
  }

  // Получить статистику по часам проекта
  async getProjectHoursStats(
    projectId: number,
    from?: string,
    to?: string
  ): Promise<{ totalHours: number; entries: EasyRedmineTimeEntry[] }> {
    try {
      const response = await this.getProjectTimeEntries(projectId, 1000, 0, from, to);
      const totalHours = response.data.reduce((sum, entry) => sum + entry.hours, 0);
      return { totalHours, entries: response.data };
    } catch (error) {
      console.error(`Error fetching project hours stats for project ${projectId}:`, error);
      throw new Error(`Failed to fetch project hours stats for project ${projectId}`);
    }
  }
}
