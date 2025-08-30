import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LandscapeControlService, LandscapeSettings } from '../../services/landscape-control.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landscape-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-panel" [class.open]="isOpen" [class.theme-dark]="currentTheme === 'dark'">
      <button class="toggle-button" (click)="togglePanel()" [title]="isOpen ? 'Скрыть панель' : 'Показать панель'">
        {{ isOpen ? '⚙️' : '🎨' }}
      </button>
      
      <div class="panel-content" *ngIf="isOpen">
        <div class="panel-header">
          <h3>🎨 Управление 3D ландшафтом</h3>
          <button class="close-button" (click)="togglePanel()">×</button>
        </div>
        
        <div class="control-group">
          <label>Амплитуда волн: {{ settings.waveAmplitude }}</label>
          <input 
            type="range" 
            min="5" 
            max="30" 
            step="1"
            [(ngModel)]="settings.waveAmplitude"
            (input)="updateWaveAmplitude()"
            class="slider">
        </div>
        
        <div class="control-group">
          <label>Скорость анимации: {{ settings.animationSpeed.toFixed(1) }}</label>
          <input 
            type="range" 
            min="0.1" 
            max="2.0" 
            step="0.1"
            [(ngModel)]="settings.animationSpeed"
            (input)="updateAnimationSpeed()"
            class="slider">
        </div>
        
        <div class="control-group">
          <label>Размер точек: {{ settings.pointSize }}</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            step="0.5"
            [(ngModel)]="settings.pointSize"
            (input)="updatePointSize()"
            class="slider">
        </div>
        
        <div class="control-group">
          <label>Размер сетки: {{ settings.gridSize }}</label>
          <input 
            type="range" 
            min="50" 
            max="150" 
            step="10"
            [(ngModel)]="settings.gridSize"
            (input)="updateGridSize()"
            class="slider">
        </div>
        
        <div class="control-group">
          <label>Цветовая схема:</label>
          <select [(ngModel)]="settings.colorScheme" (change)="updateColorScheme()" class="select">
            <option value="wone-it">Wone IT (Синяя)</option>
            <option value="sunset">Закат (Оранжевая)</option>
            <option value="ocean">Океан (Сине-зеленая)</option>
            <option value="forest">Лес (Зеленая)</option>
          </select>
        </div>
        
        <div class="preset-buttons">
          <button 
            *ngFor="let scheme of presetSchemes | keyvalue" 
            (click)="applyPreset(scheme.key)"
            class="preset-button"
            [class.active]="settings.colorScheme === scheme.key">
            {{ scheme.value.name }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .control-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .toggle-button {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 100%);
      color: white;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    .toggle-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(59,130,246,0.4);
    }
    
    .panel-content {
      position: absolute;
      top: 60px;
      right: 0;
      width: 300px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 2px solid rgba(59,130,246,0.2);
      box-shadow: 0 8px 32px rgba(59,130,246,0.15);
      padding: 20px;
      margin-top: 10px;
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(59,130,246,0.2);
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #1e293b;
      font-weight: 600;
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .close-button:hover {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
    }
    
    .control-group {
      margin-bottom: 20px;
    }
    
    .control-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }
    
    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(59,130,246,0.2);
      outline: none;
      -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    
    .slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    
    .select {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid rgba(59,130,246,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.9);
      color: #374151;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .select:focus {
      outline: none;
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    
    .preset-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 20px;
    }
    
    .preset-button {
      padding: 8px 12px;
      border: 2px solid rgba(59,130,246,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.8);
      color: #374151;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    
    .preset-button:hover {
      background: rgba(59,130,246,0.1);
      border-color: rgba(59,130,246,0.4);
      transform: translateY(-1px);
    }
    
    .preset-button.active {
      background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
      border-color: rgba(59,130,246,0.5);
      color: #1d4ed8;
    }
    
    /* Темная тема */
    :host-context(.theme-dark) .panel-content,
    .theme-dark .panel-content {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(59,130,246,0.3);
    }
    
    :host-context(.theme-dark) .panel-header h3,
    .theme-dark .panel-header h3 {
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .control-group label,
    .theme-dark .control-group label {
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .select,
    .theme-dark .select {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59,130,246,0.3);
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .preset-button,
    .theme-dark .preset-button {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(59,130,246,0.3);
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .preset-button:hover,
    .theme-dark .preset-button:hover {
      background: rgba(59,130,246,0.2);
    }
    
    /* Дополнительные стили для темной темы */
    .theme-dark .control-panel {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(59,130,246,0.3);
    }
    
    .theme-dark .toggle-button {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59,130,246,0.3);
      color: #f8fafc;
    }
    
    .theme-dark .toggle-button:hover {
      background: rgba(59,130,246,0.2);
      border-color: rgba(59,130,246,0.5);
    }
    
    .theme-dark .slider {
      background: rgba(30, 41, 59, 0.9);
    }
    
    .theme-dark .slider::-webkit-slider-thumb {
      background: #3b82f6;
    }
    
    .theme-dark .slider::-moz-range-thumb {
      background: #3b82f6;
    }
  `]
})
export class LandscapeControlPanelComponent implements OnInit, OnDestroy {
  isOpen = false;
  settings: LandscapeSettings;
  presetSchemes: { [key: string]: { name: string; description: string; colors: { r: number; g: number; b: number } } };
  currentTheme: 'light' | 'dark' = 'light';
  private subscription!: Subscription;
  private themeSubscription!: Subscription;

  constructor(
    private landscapeService: LandscapeControlService,
    private userSettingsService: UserSettingsService
  ) {
    this.settings = this.landscapeService.getCurrentSettings();
    this.presetSchemes = this.landscapeService.getPresetSchemes();
  }

  ngOnInit(): void {
    this.subscription = this.landscapeService.settings$.subscribe(settings => {
      this.settings = settings;
    });
    
    // Подписываемся на изменения темы
    this.themeSubscription = this.userSettingsService.settings$.subscribe(settings => {
      this.currentTheme = settings.ui.theme;
    });
    
    // Инициализируем текущую тему
    const userSettings = this.userSettingsService.getSettings();
    this.currentTheme = userSettings.ui.theme;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  updateWaveAmplitude(): void {
    this.landscapeService.setWaveAmplitude(this.settings.waveAmplitude);
  }

  updateAnimationSpeed(): void {
    this.landscapeService.setAnimationSpeed(this.settings.animationSpeed);
  }

  updatePointSize(): void {
    this.landscapeService.setPointSize(this.settings.pointSize);
  }

  updateGridSize(): void {
    this.landscapeService.setGridSize(this.settings.gridSize);
  }

  updateColorScheme(): void {
    this.landscapeService.setColorScheme(this.settings.colorScheme);
  }

  applyPreset(schemeKey: string | number): void {
    this.landscapeService.setColorScheme(schemeKey.toString() as LandscapeSettings['colorScheme']);
  }
}
