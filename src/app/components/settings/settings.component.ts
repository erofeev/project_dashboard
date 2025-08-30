import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LandscapeControlService, LandscapeSettings } from '../../services/landscape-control.service';
import { UserSettingsService, UserSettings } from '../../services/user-settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-button" (click)="goBack()">
          <span class="back-icon">←</span>
          {{ getTranslation('SETTINGS.BACK', 'Назад') }}
        </button>
        <h1 class="settings-title">{{ getTranslation('SETTINGS.TITLE', 'Настройки') }}</h1>
      </div>

      <div class="settings-content">
        <!-- Навигация по разделам -->
        <div class="settings-nav">
          <button 
            *ngFor="let section of settingsSections" 
            (click)="selectSection(section.id)"
            class="nav-button"
            [class.active]="activeSection === section.id">
            <span class="nav-icon">{{ section.icon }}</span>
            {{ section.title }}
          </button>
        </div>

        <!-- Содержимое разделов -->
        <div class="settings-panel">
          <!-- UI настройки -->
          <div *ngIf="activeSection === 'ui'" class="section-content">
            <h2 class="section-title">{{ getTranslation('SETTINGS.UI.TITLE', 'Настройки интерфейса') }}</h2>
            
            <div class="settings-group">
              <h3>{{ getTranslation('SETTINGS.UI.LANDSCAPE_TITLE', '3D Ландшафт') }}</h3>
              <p class="setting-description">
                {{ getTranslation('SETTINGS.UI.LANDSCAPE_DESCRIPTION', 'Настройте параметры анимированного 3D фона') }}
              </p>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.UI.WAVE_AMPLITUDE', 'Амплитуда волн') }}: {{ landscapeSettings.waveAmplitude }}
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="1"
                  [(ngModel)]="landscapeSettings.waveAmplitude"
                  (input)="updateLandscapeSettings()"
                  class="control-slider">
                <div class="control-range">
                  <span>5</span>
                  <span>30</span>
                </div>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.UI.ANIMATION_SPEED', 'Скорость анимации') }}: {{ landscapeSettings.animationSpeed.toFixed(1) }}
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.1"
                  [(ngModel)]="landscapeSettings.animationSpeed"
                  (input)="updateLandscapeSettings()"
                  class="control-slider">
                <div class="control-range">
                  <span>0.1</span>
                  <span>2.0</span>
                </div>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.UI.POINT_SIZE', 'Размер точек') }}: {{ landscapeSettings.pointSize }}
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.5"
                  [(ngModel)]="landscapeSettings.pointSize"
                  (input)="updateLandscapeSettings()"
                  class="control-slider">
                <div class="control-range">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.UI.GRID_SIZE', 'Размер сетки') }}: {{ landscapeSettings.gridSize }}
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  step="10"
                  [(ngModel)]="landscapeSettings.gridSize"
                  (input)="updateLandscapeSettings()"
                  class="control-slider">
                <div class="control-range">
                  <span>50</span>
                  <span>150</span>
                </div>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.UI.COLOR_SCHEME', 'Цветовая схема') }}
                </label>
                <select [(ngModel)]="landscapeSettings.colorScheme" (change)="updateLandscapeSettings()" class="control-select">
                  <option value="wone-it">{{ getTranslation('SETTINGS.UI.COLOR_WONE_IT', 'Wone IT (Синяя)') }}</option>
                  <option value="sunset">{{ getTranslation('SETTINGS.UI.COLOR_SUNSET', 'Закат (Оранжевая)') }}</option>
                  <option value="ocean">{{ getTranslation('SETTINGS.UI.COLOR_OCEAN', 'Океан (Сине-зеленая)') }}</option>
                  <option value="forest">{{ getTranslation('SETTINGS.UI.COLOR_FOREST', 'Лес (Зеленая)') }}</option>
                </select>
              </div>
              
              <!-- Настройки темы -->
              <div class="settings-group">
                <h3>{{ getTranslation('SETTINGS.UI.THEME_TITLE', 'Тема оформления') }}</h3>
                <p class="setting-description">
                  {{ getTranslation('SETTINGS.UI.THEME_DESCRIPTION', 'Выберите светлую или темную тему интерфейса') }}
                </p>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.THEME_MODE', 'Режим темы') }}
                  </label>
                  <div class="theme-toggle">
                    <button 
                      (click)="setTheme('light')"
                      class="theme-button"
                      [class.active]="uiSettings.theme === 'light'">
                      ☀️ {{ getTranslation('SETTINGS.UI.THEME_LIGHT', 'Светлая') }}
                    </button>
                    <button 
                      (click)="setTheme('dark')"
                      class="theme-button"
                      [class.active]="uiSettings.theme === 'dark'">
                      🌙 {{ getTranslation('SETTINGS.UI.THEME_DARK', 'Темная') }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Настройки прозрачности и блюра -->
              <div class="settings-group">
                <h3>{{ getTranslation('SETTINGS.UI.TRANSPARENCY_TITLE', 'Прозрачность и блюр') }}</h3>
                <p class="setting-description">
                  {{ getTranslation('SETTINGS.UI.TRANSPARENCY_DESCRIPTION', 'Настройте прозрачность и эффект размытия для различных элементов интерфейса') }}
                </p>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.FORMS_TRANSPARENCY', 'Прозрачность форм') }}: {{ uiSettings.transparency.forms }}%
                  </label>
                  <input 
                    type="range" 
                    min="50" 
                    max="95" 
                    step="5"
                    [(ngModel)]="uiSettings.transparency.forms"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>50%</span>
                    <span>95%</span>
                  </div>
                </div>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.WIDGETS_TRANSPARENCY', 'Прозрачность виджетов') }}: {{ uiSettings.transparency.widgets }}%
                  </label>
                  <input 
                    type="range" 
                    min="70" 
                    max="95" 
                    step="5"
                    [(ngModel)]="uiSettings.transparency.widgets"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>70%</span>
                    <span>95%</span>
                  </div>
                </div>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.SIDEBARS_TRANSPARENCY', 'Прозрачность сайдбаров') }}: {{ uiSettings.transparency.sidebars }}%
                  </label>
                  <input 
                    type="range" 
                    min="70" 
                    max="95" 
                    step="5"
                    [(ngModel)]="uiSettings.transparency.sidebars"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>70%</span>
                    <span>95%</span>
                  </div>
                </div>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.FORMS_BLUR', 'Блюр форм') }}: {{ uiSettings.blur.forms }}px
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1"
                    [(ngModel)]="uiSettings.blur.forms"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>0px</span>
                    <span>20px</span>
                  </div>
                </div>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.WIDGETS_BLUR', 'Блюр виджетов') }}: {{ uiSettings.blur.widgets }}px
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1"
                    [(ngModel)]="uiSettings.blur.widgets"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>0px</span>
                    <span>20px</span>
                  </div>
                </div>
                
                <div class="control-group">
                  <label class="control-label">
                    {{ getTranslation('SETTINGS.UI.SIDEBARS_BLUR', 'Блюр сайдбаров') }}: {{ uiSettings.blur.sidebars }}px
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5"
                    [(ngModel)]="uiSettings.blur.sidebars"
                    (input)="updateUISettings()"
                    class="control-slider">
                  <div class="control-range">
                    <span>10px</span>
                    <span>50px</span>
                  </div>
                </div>
              </div>
              
              <!-- Пользовательский пресет -->
              <div class="custom-preset-section">
                <h4>{{ getTranslation('SETTINGS.UI.CUSTOM_PRESET', 'Пользовательский пресет') }}</h4>
                <p class="setting-description">
                  {{ getTranslation('SETTINGS.UI.CUSTOM_PRESET_DESCRIPTION', 'Сохраните текущие настройки как пользовательский пресет') }}
                </p>
                <button 
                  (click)="saveAsCustomPreset()"
                  class="preset-button custom"
                  [class.active]="landscapeSettings.colorScheme === 'custom'">
                  💾 {{ getTranslation('SETTINGS.UI.SAVE_CUSTOM', 'Сохранить текущий') }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Настройки фильтров -->
          <div *ngIf="activeSection === 'filters'" class="section-content">
            <h2 class="section-title">{{ getTranslation('SETTINGS.FILTERS.TITLE', 'Настройки фильтров') }}</h2>
            
            <div class="settings-group">
              <h3>{{ getTranslation('SETTINGS.FILTERS.PROJECTS_TITLE', 'Фильтры проектов') }}</h3>
              <p class="setting-description">
                {{ getTranslation('SETTINGS.FILTERS.PROJECTS_DESCRIPTION', 'Настройте фильтры по умолчанию для проектов') }}
              </p>
              
              <div class="filter-section">
                <h4>{{ getTranslation('SETTINGS.FILTERS.STATUS_FILTERS', 'Фильтры по статусу') }}</h4>
                <div class="checkbox-group">
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.status" value="active">
                    {{ getTranslation('SETTINGS.FILTERS.STATUS_ACTIVE', 'Активные') }}
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.status" value="completed">
                    {{ getTranslation('SETTINGS.FILTERS.STATUS_COMPLETED', 'Завершённые') }}
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.status" value="on-hold">
                    {{ getTranslation('SETTINGS.FILTERS.STATUS_ON_HOLD', 'На паузе') }}
                  </label>
                </div>
              </div>
              
              <div class="filter-section">
                <h4>{{ getTranslation('SETTINGS.FILTERS.PRIORITY_FILTERS', 'Фильтры по приоритету') }}</h4>
                <div class="checkbox-group">
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.priority" value="high">
                    {{ getTranslation('SETTINGS.FILTERS.PRIORITY_HIGH', 'Высокий') }}
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.priority" value="medium">
                    {{ getTranslation('SETTINGS.FILTERS.PRIORITY_MEDIUM', 'Средний') }}
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" [(ngModel)]="projectFilters.priority" value="low">
                    {{ getTranslation('SETTINGS.FILTERS.PRIORITY_LOW', 'Низкий') }}
                  </label>
                </div>
              </div>
            </div>
            
            <div class="settings-group">
              <h3>{{ getTranslation('SETTINGS.FILTERS.ANALYTICS_TITLE', 'Фильтры аналитики') }}</h3>
              <p class="setting-description">
                {{ getTranslation('SETTINGS.FILTERS.ANALYTICS_DESCRIPTION', 'Настройте параметры аналитических отчётов') }}
              </p>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.FILTERS.TIME_RANGE', 'Временной диапазон по умолчанию') }}
                </label>
                <select [(ngModel)]="analyticsFilters.timeRange" (change)="updateAnalyticsFilters()" class="control-select">
                  <option value="week">{{ getTranslation('SETTINGS.FILTERS.TIME_WEEK', 'Неделя') }}</option>
                  <option value="month">{{ getTranslation('SETTINGS.FILTERS.TIME_MONTH', 'Месяц') }}</option>
                  <option value="quarter">{{ getTranslation('SETTINGS.FILTERS.TIME_QUARTER', 'Квартал') }}</option>
                  <option value="year">{{ getTranslation('SETTINGS.FILTERS.TIME_YEAR', 'Год') }}</option>
                </select>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  {{ getTranslation('SETTINGS.FILTERS.CHART_TYPE', 'Тип графика по умолчанию') }}
                </label>
                <select [(ngModel)]="analyticsFilters.chartType" (change)="updateAnalyticsFilters()" class="control-select">
                  <option value="line">{{ getTranslation('SETTINGS.FILTERS.CHART_LINE', 'Линейный') }}</option>
                  <option value="bar">{{ getTranslation('SETTINGS.FILTERS.CHART_BAR', 'Столбчатый') }}</option>
                  <option value="pie">{{ getTranslation('SETTINGS.FILTERS.CHART_PIE', 'Круговой') }}</option>
                  <option value="area">{{ getTranslation('SETTINGS.FILTERS.CHART_AREA', 'Областной') }}</option>
                </select>
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  <input type="checkbox" [(ngModel)]="analyticsFilters.showTrends" (change)="updateAnalyticsFilters()">
                  {{ getTranslation('SETTINGS.FILTERS.SHOW_TRENDS', 'Показывать тренды') }}
                </label>
              </div>
            </div>
            
            <div class="actions-section">
              <button class="action-button secondary" (click)="clearAllFilters()">
                {{ getTranslation('SETTINGS.FILTERS.CLEAR_ALL', 'Очистить все фильтры') }}
              </button>
              <button class="action-button primary" (click)="saveFilterSettings()">
                {{ getTranslation('SETTINGS.FILTERS.SAVE', 'Сохранить настройки') }}
              </button>
            </div>
          </div>
          
          <!-- Другие разделы (заглушки) -->
          <div *ngIf="activeSection === 'account'" class="section-content">
            <h2 class="section-title">{{ getTranslation('SETTINGS.ACCOUNT.TITLE', 'Настройки аккаунта') }}</h2>
            <p class="coming-soon">{{ getTranslation('SETTINGS.COMING_SOON', 'Скоро будет доступно') }}</p>
          </div>
          
          <div *ngIf="activeSection === 'notifications'" class="section-content">
            <h2 class="section-title">{{ getTranslation('SETTINGS.NOTIFICATIONS.TITLE', 'Уведомления') }}</h2>
            <p class="coming-soon">{{ getTranslation('SETTINGS.COMING_SOON', 'Скоро будет доступно') }}</p>
          </div>
          
          <div *ngIf="activeSection === 'privacy'" class="section-content">
            <h2 class="section-title">{{ getTranslation('SETTINGS.PRIVACY.TITLE', 'Конфиденциальность') }}</h2>
            <p class="coming-soon">{{ getTranslation('SETTINGS.COMING_SOON', 'Скоро будет доступно') }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: calc(100vh - 120px);
    }
    
    .settings-header {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(59,130,246,0.2);
    }
    
    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%);
      border: 2px solid rgba(59,130,246,0.3);
      border-radius: 12px;
      padding: 12px 20px;
      color: #3b82f6;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      margin-right: 20px;
    }
    
    .back-button:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(59,130,246,0.2);
    }
    
    .back-icon {
      font-size: 18px;
      font-weight: bold;
    }
    
    .settings-title {
      margin: 0;
      font-size: 2.5rem;
      background: linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #1d4ed8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }
    
    .settings-content {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 30px;
    }
    
    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .nav-button {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.8);
      border: 2px solid rgba(59,130,246,0.2);
      border-radius: 12px;
      padding: 16px 20px;
      color: #374151;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      text-align: left;
    }
    
    .nav-button:hover {
      background: rgba(59,130,246,0.1);
      border-color: rgba(59,130,246,0.4);
      transform: translateX(4px);
    }
    
    .nav-button.active {
      background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
      border-color: rgba(59,130,246,0.5);
      color: #1d4ed8;
      box-shadow: 0 4px 16px rgba(59,130,246,0.15);
    }
    
    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }
    
    .settings-panel {
      background: rgba(255,255,255,0.9);
      border-radius: 16px;
      border: 2px solid rgba(59,130,246,0.2);
      padding: 30px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(59,130,246,0.1);
    }
    
    .section-title {
      margin: 0 0 25px 0;
      font-size: 1.8rem;
      color: #1e293b;
      font-weight: 600;
      border-bottom: 2px solid rgba(59,130,246,0.2);
      padding-bottom: 15px;
    }
    
    .settings-group {
      margin-bottom: 20px; /* Уменьшили с 30px */
    }
    
    .settings-group h3 {
      margin: 0 0 12px 0; /* Уменьшили с 15px */
      font-size: 1.2rem; /* Уменьшили с 1.3rem */
      color: #374151;
      font-weight: 600;
    }
    
    .setting-description {
      margin: 0 0 18px 0; /* Уменьшили с 25px */
      color: #6b7280;
      line-height: 1.5; /* Уменьшили с 1.6 */
      font-size: 13px; /* Уменьшили с 14px */
    }
    
    .control-group {
      margin-bottom: 18px; /* Уменьшили с 25px */
    }
    
    .control-label {
      display: block;
      margin-bottom: 8px; /* Уменьшили с 10px */
      font-weight: 600;
      color: #374151;
      font-size: 13px; /* Уменьшили с 14px */
    }
    
    .control-slider {
      width: 100%;
      height: 6px; /* Уменьшили с 8px */
      border-radius: 3px; /* Уменьшили с 4px */
      background: rgba(59,130,246,0.2);
      outline: none;
      -webkit-appearance: none;
      margin-bottom: 6px; /* Уменьшили с 8px */
    }
    
    .control-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px; /* Уменьшили с 20px */
      height: 18px; /* Уменьшили с 20px */
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    
    .control-slider::-moz-range-thumb {
      width: 18px; /* Уменьшили с 20px */
      height: 18px; /* Уменьшили с 20px */
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    
    .control-range {
      display: flex;
      justify-content: space-between;
      font-size: 11px; /* Уменьшили с 12px */
      color: #6b7280;
    }
    
    .control-select {
      width: 100%;
      padding: 10px 14px; /* Уменьшили padding */
      border: 2px solid rgba(59,130,246,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.9);
      color: #374151;
      font-size: 13px; /* Уменьшили с 14px */
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .control-select:focus {
      outline: none;
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    
    .preset-section {
      margin-top: 30px;
      padding-top: 25px;
      border-top: 1px solid rgba(59,130,246,0.2);
    }
    
    .preset-section h4 {
      margin: 0 0 15px 0;
      font-size: 1.1rem;
      color: #374151;
      font-weight: 600;
    }
    
    .preset-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .preset-button {
      padding: 10px 16px;
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
    
    .custom-preset-section {
      margin-top: 18px; /* Уменьшили с 24px */
      padding-top: 16px; /* Уменьшили с 20px */
      border-top: 1px solid rgba(59,130,246,0.2);
    }
    
    .custom-preset-section h4 {
      margin: 0 0 10px 0; /* Уменьшили с 12px */
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
    }
    
    .preset-button.custom {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: #10b981;
      color: white;
    }
    
    .preset-button.custom:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-color: #059669;
    }
    
    .preset-button.custom.active {
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      border-color: #047857;
      box-shadow: 0 4px 16px rgba(16,185,129,0.3);
    }
    
    .coming-soon {
      text-align: center;
      color: #6b7280;
      font-style: italic;
      padding: 40px;
      font-size: 16px;
    }
    
    /* Стили для фильтров */
    .filter-section {
      margin-bottom: 18px; /* Уменьшили с 25px */
      padding: 16px; /* Уменьшили с 20px */
      background: rgba(59,130,246,0.05);
      border-radius: 8px;
      border: 1px solid rgba(59,130,246,0.1);
    }
    
    .filter-section h4 {
      margin: 0 0 12px 0; /* Уменьшили с 15px */
      font-size: 1rem; /* Уменьшили с 1.1rem */
      color: #374151;
      font-weight: 600;
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 10px; /* Уменьшили с 12px */
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px; /* Уменьшили с 10px */
      cursor: pointer;
      font-size: 13px; /* Уменьшили с 14px */
      color: #374151;
    }
    
    .checkbox-item input[type="checkbox"] {
      width: 16px; /* Уменьшили с 18px */
      height: 16px; /* Уменьшили с 18px */
      accent-color: #3b82f6;
    }
    
    .actions-section {
      display: flex;
      gap: 12px; /* Уменьшили с 15px */
      margin-top: 20px; /* Уменьшили с 30px */
      padding-top: 18px; /* Уменьшили с 25px */
      border-top: 1px solid rgba(59,130,246,0.2);
    }
    
    .action-button {
      padding: 10px 20px; /* Уменьшили padding */
      border: 2px solid;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px; /* Уменьшили с 14px */
    }
    
    .action-button.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-color: #3b82f6;
      color: white;
    }
    
    .action-button.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
    }
    
    .action-button.secondary {
      background: rgba(255,255,255,0.8);
      border-color: rgba(59,130,246,0.3);
      color: #3b82f6;
    }
    
    .action-button.secondary:hover {
      background: rgba(59,130,246,0.1);
      border-color: rgba(59,130,246,0.5);
    }
    
    /* Стили для переключения темы */
    .theme-toggle {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    
    .theme-button {
      flex: 1;
      padding: 12px 20px;
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.8);
      color: #374151;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    
    .theme-button:hover {
      border-color: rgba(59, 130, 246, 0.4);
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }
    
    .theme-button.active {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    }
    
    .theme-button.active:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }
    
    /* Темная тема */
    :host-context(.theme-dark) .settings-panel {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59,130,246,0.3);
    }
    
    :host-context(.theme-dark) .nav-button {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(59,130,246,0.3);
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .nav-button:hover {
      background: rgba(59,130,246,0.2);
    }
    
    :host-context(.theme-dark) .nav-button.active {
      background: linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.3) 100%);
      border-color: rgba(59,130,246,0.6);
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .section-title {
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .settings-group h3 {
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .control-label {
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .control-select {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59,130,246,0.3);
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .preset-button {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(59,130,246,0.3);
      color: #e5e7eb;
    }
    
    /* Адаптивность */
    @media (max-width: 768px) {
      .settings-content {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 10px;
      }
      
      .nav-button {
        white-space: nowrap;
        min-width: 140px;
      }
      
      .settings-container {
        padding: 15px;
      }
      
      .settings-title {
        font-size: 2rem;
      }
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeSection = 'ui';
  landscapeSettings: LandscapeSettings;
  presetSchemes: { [key: string]: { name: string; description: string; colors: { r: number; g: number; b: number } } };
  
  // Фильтры
  projectFilters: any;
  analyticsFilters: any;
  
  // UI настройки
  uiSettings: any;
  
  private subscription!: Subscription;

  settingsSections = [
    { id: 'ui', title: 'Интерфейс', icon: '🎨' },
    { id: 'filters', title: 'Фильтры', icon: '🔍' },
    { id: 'account', title: 'Аккаунт', icon: '👤' },
    { id: 'notifications', title: 'Уведомления', icon: '🔔' },
    { id: 'privacy', title: 'Конфиденциальность', icon: '🔒' }
  ];

  constructor(
    private router: Router,
    private landscapeService: LandscapeControlService,
    private userSettingsService: UserSettingsService,
    private translateService: TranslateService
  ) {
    this.landscapeSettings = this.landscapeService.getCurrentSettings();
    this.presetSchemes = this.landscapeService.getPresetSchemes();
  }

  ngOnInit(): void {
    this.subscription = this.landscapeService.settings$.subscribe(settings => {
      this.landscapeSettings = settings;
    });
    
    // Инициализируем фильтры
    const userSettings = this.userSettingsService.getSettings();
    this.projectFilters = { ...userSettings.filters.projects };
    this.analyticsFilters = { ...userSettings.filters.analytics };
    
    // Инициализируем UI настройки
    this.uiSettings = { ...userSettings.ui };
    
    // Инициализируем настройки ландшафта
    this.landscapeSettings = { ...this.landscapeService.getCurrentSettings() };
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  selectSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  updateLandscapeSettings(): void {
    // Обновляем настройки ландшафта
    this.landscapeService.updateSettings(this.landscapeSettings);
    
    // Обновляем UI настройки, чтобы сохранить изменения
    this.userSettingsService.updateSection('landscape', this.landscapeSettings);
  }

  applyPreset(schemeKey: string | number): void {
    this.landscapeSettings.colorScheme = schemeKey.toString() as LandscapeSettings['colorScheme'];
    this.updateLandscapeSettings();
  }

  getTranslation(key: string, fallback: string): string {
    return this.translateService.instant(key) || fallback;
  }

  getPresetName(schemeKey: string | number): string {
    const key = schemeKey.toString().toUpperCase().replace('-', '_');
    const translationKey = `SETTINGS.UI.PRESET_NAMES.${key}`;
    const translation = this.getTranslation(translationKey, '');
    
    // Если перевод не найден, используем fallback из presetSchemes
    if (!translation) {
      const scheme = this.presetSchemes[schemeKey.toString()];
      return scheme ? scheme.name : schemeKey.toString();
    }
    
    return translation;
  }

  updateAnalyticsFilters(): void {
    this.userSettingsService.updateSection('filters', {
      analytics: this.analyticsFilters
    });
  }

  saveFilterSettings(): void {
    this.userSettingsService.updateSection('filters', {
      projects: this.projectFilters,
      analytics: this.analyticsFilters
    });
  }

  clearAllFilters(): void {
    this.userSettingsService.clearAllFilters();
    // Обновляем локальные переменные
    const userSettings = this.userSettingsService.getSettings();
    this.projectFilters = { ...userSettings.filters.projects };
    this.analyticsFilters = { ...userSettings.filters.analytics };
  }

  updateUISettings(): void {
    // Сохраняем текущий активный пресет ландшафта
    const currentLandscapeSettings = this.landscapeService.getCurrentSettings();
    
    // Обновляем только UI настройки, не затрагивая настройки ландшафта
    this.userSettingsService.updateSection('ui', {
      theme: this.uiSettings.theme,
      language: this.uiSettings.language,
      sidebarCollapsed: this.uiSettings.sidebarCollapsed,
      animationsEnabled: this.uiSettings.animationsEnabled,
      transparency: this.uiSettings.transparency,
      blur: this.uiSettings.blur
    });
    
    // Восстанавливаем настройки ландшафта, чтобы пресет не сбрасывался
    this.landscapeService.updateSettings(currentLandscapeSettings);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.uiSettings.theme = theme;
    this.updateUISettings();
    
    // Применяем тему к body
    const host = document.querySelector('body');
    if (host) { 
      host.classList.toggle('theme-dark', theme === 'dark'); 
    }
  }

  saveAsCustomPreset(): void {
    // Устанавливаем текущую схему как пользовательский пресет
    this.landscapeSettings.colorScheme = 'custom';
    this.updateLandscapeSettings();
  }
}
