import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../models/user.model';

@Pipe({
  name: 'translateRole',
  standalone: true
})
export class TranslateRolePipe implements PipeTransform {
  transform(role: UserRole): string {
    switch (role) {
      case UserRole.GENERAL_DIRECTOR:
        return 'Генеральный директор';
      case UserRole.DIRECTOR:
        return 'Директор направления';
      case UserRole.PROJECT_MANAGER:
        return 'Руководитель проекта';
      case UserRole.EMPLOYEE:
        return 'Сотрудник';
      default:
        return 'Неизвестная роль';
    }
  }
}
