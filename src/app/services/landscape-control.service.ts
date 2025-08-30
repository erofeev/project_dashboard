import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserSettingsService } from './user-settings.service';

export interface LandscapeSettings {
  waveAmplitude: number;
  animationSpeed: number;
  pointSize: number;
  gridSize: number;
  colorScheme: 'wone-it' | 'sunset' | 'ocean' | 'forest';
}

@Injectable({
  providedIn: 'root'
})
export class LandscapeControlService {
  private settingsSubject = new BehaviorSubject<LandscapeSettings>({
    waveAmplitude: 15,
    animationSpeed: 0.5,
    pointSize: 2,
    gridSize: 100,
    colorScheme: 'wone-it'
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(private userSettingsService: UserSettingsService) {
    // Подписываемся на изменения настроек пользователя
    this.userSettingsService.settings$.subscribe(settings => {
      this.updateSettingsFromUserSettings(settings.landscape);
    });
    
    // Инициализируем с настройками пользователя
    const userSettings = this.userSettingsService.getSettings();
    this.updateSettingsFromUserSettings(userSettings.landscape);
  }

  updateSettings(settings: Partial<LandscapeSettings>): void {
    const currentSettings = this.settingsSubject.value;
    this.settingsSubject.next({ ...currentSettings, ...settings });
  }

  setWaveAmplitude(amplitude: number): void {
    this.updateSettings({ waveAmplitude: amplitude });
    // Сохраняем в настройки пользователя
    this.userSettingsService.updateSection('landscape', { waveAmplitude: amplitude });
  }

  setAnimationSpeed(speed: number): void {
    this.updateSettings({ animationSpeed: speed });
    // Сохраняем в настройки пользователя
    this.userSettingsService.updateSection('landscape', { animationSpeed: speed });
  }

  setPointSize(size: number): void {
    this.updateSettings({ pointSize: size });
    // Сохраняем в настройки пользователя
    this.userSettingsService.updateSection('landscape', { pointSize: size });
  }

  setGridSize(size: number): void {
    this.updateSettings({ gridSize: size });
    // Сохраняем в настройки пользователя
    this.userSettingsService.updateSection('landscape', { gridSize: size });
  }

  setColorScheme(scheme: LandscapeSettings['colorScheme']): void {
    this.updateSettings({ colorScheme: scheme });
    // Сохраняем в настройки пользователя
    this.userSettingsService.updateSection('landscape', { colorScheme: scheme });
  }

  getCurrentSettings(): LandscapeSettings {
    return this.settingsSubject.value;
  }

  private updateSettingsFromUserSettings(landscapeSettings: any): void {
    if (landscapeSettings) {
      this.settingsSubject.next({
        waveAmplitude: landscapeSettings.waveAmplitude || 15,
        animationSpeed: landscapeSettings.animationSpeed || 0.5,
        pointSize: landscapeSettings.pointSize || 2,
        gridSize: landscapeSettings.gridSize || 100,
        colorScheme: landscapeSettings.colorScheme || 'wone-it'
      });
    }
  }

  // Предустановленные схемы
  getPresetSchemes() {
    return {
      'wone-it': {
        name: 'Wone IT',
        description: 'Корпоративная схема в фиолетово-красных тонах с бинарным кодом',
        colors: { r: 0.6, g: 0.2, b: 0.8 } // Фиолетовый основной цвет
      },
      'sunset': {
        name: 'Закат',
        description: 'Теплые оранжево-красные тона',
        colors: { r: 1.0, g: 0.4, b: 0.2 }
      },
      'ocean': {
        name: 'Океан',
        description: 'Глубокие сине-зеленые тона',
        colors: { r: 0.1, g: 0.6, b: 0.8 }
      },
      'forest': {
        name: 'Лес',
        description: 'Природные зеленые тона',
        colors: { r: 0.2, g: 0.7, b: 0.3 }
      }
    };
  }
}
