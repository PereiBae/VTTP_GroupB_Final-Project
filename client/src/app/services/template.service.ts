import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {WorkoutTemplate} from '../models/workout-template';
import {TemplateExercise} from '../models/template-exercise';
import {map, Observable} from 'rxjs';
import {BaseService} from './base.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService extends BaseService{

  constructor(http: HttpClient) {
    super(http);
  }

  // Get all templates for the current user
  getTemplates(): Observable<WorkoutTemplate[]> {
    return this.http.get<WorkoutTemplate[]>('/api/templates', {headers:this.getAuthHeaders()});
  }

  // Get a template with its exercises
  getTemplateWithExercises(id: number): Observable<WorkoutTemplate> {
    return this.http.get<any>(`/api/templates/${id}`, {headers:this.getAuthHeaders()}).pipe(
      map(response => {
        const template = response.template as WorkoutTemplate;
        template.exercises = response.exercises as TemplateExercise[];
        return template;
      })
    );
  }

  // Create a new template
  createTemplate(template: WorkoutTemplate, exercises: TemplateExercise[]): Observable<WorkoutTemplate> {
    const payload = {
      name: template.name,
      description: template.description,
      exercises: exercises
    };

    return this.http.post<WorkoutTemplate>('/api/templates', payload, {headers:this.getAuthHeaders()});
  }

  // Update a template
  updateTemplate(id: number, template: WorkoutTemplate, exercises: TemplateExercise[]): Observable<WorkoutTemplate> {
    const payload = {
      name: template.name,
      description: template.description,
      exercises: exercises
    };

    return this.http.put<WorkoutTemplate>(`/api/templates/${id}`, payload, {headers:this.getAuthHeaders()});
  }

  // Delete a template
  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`/api/templates/${id}`, {headers:this.getAuthHeaders()});
  }

}
