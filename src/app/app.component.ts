import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthState } from './services/auth.service';
import { Landscape3dComponent } from './components/3d-landscape/3d-landscape.component';
import { LandscapeControlPanelComponent } from './components/landscape-control-panel/landscape-control-panel.component';
import { UserSettingsService } from './services/user-settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    FormsModule,
    Landscape3dComponent,
    LandscapeControlPanelComponent
  ],
  template: `
    <!-- 3D анимированный ландшафт-подложка -->
    <app-3d-landscape></app-3d-landscape>
    
    <!-- Панель управления 3D ландшафтом -->
    <app-landscape-control-panel></app-landscape-control-panel>
    
    <div class="app-container" [class.sidebar-open]="leftSidebarOpen" *ngIf="authState.isAuthenticated">
      <header class="glass-header" [class.sidebar-open]="leftSidebarOpen">
        <div class="header-top-row">
          <div class="left-group">
            <button class="burger glass-button" (click)="toggleLeftSidebar()" aria-label="{{ 'HEADER.MENU' | translate }}">
              &#9776;
            </button>
            <img src="assets/wone-it-logo.svg" alt="Wone IT Logo" class="app-logo" (click)="navigateToDashboard()" [title]="getTranslation('HEADER.LOGO_CLICK', 'Кликните для перехода на главную страницу')">
            <h1 class="glass-title" (click)="navigateToDashboard()" [title]="getTranslation('HEADER.TITLE_CLICK', 'Кликните для перехода на главную страницу')">{{ getTranslation('COMMON.APP_TITLE', 'Wone IT - Business Solutions - Project Management') }}</h1>
          </div>

          <div class="center-group hide-on-mobile">
            <div class="search-container">
              <input 
                class="search-input" 
                type="search" 
                [placeholder]="'HEADER.SEARCH' | translate" 
                (input)="onSearch($event)"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                [(ngModel)]="searchQuery"
                #searchInput>
              
              <!-- Подсказки поиска -->
              <div class="search-suggestions" *ngIf="showSuggestions && searchSuggestions.length > 0">
                <div class="suggestions-header">
                  <span>{{ 'SEARCH.SUGGESTIONS' | translate }}</span>
                </div>
                <div class="suggestions-items">
                  <div 
                    *ngFor="let suggestion of searchSuggestions" 
                    class="suggestion-item"
                    (click)="selectSuggestion(suggestion)">
                    <div class="suggestion-icon">{{ suggestion.icon }}</div>
                    <div class="suggestion-content">
                      <div class="suggestion-title">{{ suggestion.title }}</div>
                      <div class="suggestion-subtitle">{{ suggestion.subtitle }}</div>
                      <div class="suggestion-lang">{{ suggestion.language }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- История поиска -->
              <div class="search-history" *ngIf="showSearchHistory && searchHistory.length > 0">
                <div class="history-header">
                  <span>{{ 'SEARCH.RECENT_SEARCHES' | translate }}</span>
                  <button class="clear-history" (click)="clearSearchHistory()">
                    {{ 'SEARCH.CLEAR_HISTORY' | translate }}
                  </button>
                </div>
                <div class="history-items">
                  <div 
                    *ngFor="let item of searchHistory" 
                    class="history-item"
                    (click)="selectHistoryItem(item)">
                    <span class="history-text">{{ item }}</span>
                    <span class="history-time">{{ getTimeAgo(item) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Результаты поиска -->
              <div class="search-results" *ngIf="showSearchResults && searchResults.length > 0">
                <div class="results-header">
                  <span>{{ 'SEARCH.RESULTS' | translate }} ({{ searchResults.length }})</span>
                </div>
                <div class="results-items">
                  <div 
                    *ngFor="let result of searchResults" 
                    class="result-item"
                    (click)="navigateToSearchResult(result)">
                    <div class="result-icon">{{ result.icon }}</div>
                    <div class="result-content">
                      <div class="result-title">{{ result.title }}</div>
                      <div class="result-subtitle">{{ result.subtitle }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="right-group">
            <div class="toggles">
              <select class="glass-select" [value]="currentLang" (change)="onLangChange($event)">
                <option value="ru">RU</option>
                <option value="en">EN</option>
              </select>
              <button class="glass-button" (click)="toggleTheme()"
                      [title]="theme==='light' ? ('HEADER.THEME_LIGHT' | translate) : ('HEADER.THEME_DARK' | translate)">
                {{ theme === 'light' ? '🌙' : '☀️' }}
              </button>

            </div>
            <div class="glass-user-menu">
              <div class="user-dropdown" (click)="toggleUserMenu()" [class.open]="userMenuOpen">
                <span class="user-info" title="{{ authState.currentUser?.email }}">
                  {{ authState.currentUser?.name || 'Пользователь' }}
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>
              <div class="user-dropdown-menu" *ngIf="userMenuOpen">
                <div class="dropdown-item" (click)="onLogout()">
                  {{ getTranslation('AUTH.LOGOUT', 'Выйти') }}
                </div>
                <div class="dropdown-item" (click)="onSettings()">
                  {{ getTranslation('USER.SETTINGS', 'Настройки') }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Хлебные крошки внизу хедера -->
        <nav class="header-breadcrumbs">
          <span *ngFor="let crumb of breadcrumbs; let i = index">
            <a *ngIf="i < breadcrumbs.length - 1" (click)="navigateTo(i)">{{ crumb }}</a>
            <span *ngIf="i === breadcrumbs.length - 1">{{ crumb }}</span>
            <span *ngIf="i < breadcrumbs.length - 1"> / </span>
          </span>
        </nav>
      </header>

      <!-- Хлебные крошки убраны из основного контента - теперь в хедере -->

      <!-- Left sidebar with two-level nested navigation -->
      <aside class="glass-sidebar left" [class.open]="leftSidebarOpen" aria-hidden="{{!leftSidebarOpen}}">
        <nav class="sidebar-nav">
          <div class="menu-group">
            <div class="group-title">{{ getTranslation('NAV.DASHBOARD', 'Дашборд') }}</div>
            <a routerLink="/dashboard" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" (click)="closeLeftSidebar()"
               class="sidebar-link">
              {{ getTranslation('NAV.DASHBOARD', 'Дашборд') }}
            </a>
          </div>

          <div class="menu-group">
            <div class="group-title">{{ getTranslation('NAV.PROJECTS', 'Проекты') }}</div>
            <a routerLink="/projects" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" (click)="closeLeftSidebar()"
               class="sidebar-link">
              {{ getTranslation('NAV.PROJECTS', 'Проекты') }}
            </a>
            <div class="submenu">
              <a routerLink="/projects?filter=active" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.ACTIVE' | translate }}</a>
              <a routerLink="/projects?filter=planning" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.PLANNING' | translate }}</a>
              <a routerLink="/projects?filter=completed" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.COMPLETED' | translate }}</a>
            </div>
          </div>

          <div class="menu-group">
            <div class="group-title">{{ 'NAV.EMPLOYEES' | translate }}</div>
            <a routerLink="/employees" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" (click)="closeLeftSidebar()"
               class="sidebar-link">
              {{ 'NAV.EMPLOYEES' | translate }}
            </a>
          </div>

          <div class="menu-group">
            <div class="group-title">{{ 'NAV.INVOICES' | translate }}</div>
            <a routerLink="/invoices" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" (click)="closeLeftSidebar()"
               class="sidebar-link">
              {{ 'NAV.INVOICES' | translate }}
            </a>
            <div class="submenu">
              <a routerLink="/invoices?status=sent" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.SENT' | translate }}</a>
              <a routerLink="/invoices?status=overdue" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.OVERDUE' | translate }}</a>
              <a routerLink="/invoices?status=paid" (click)="closeLeftSidebar()"
                 class="sidebar-sublink">{{ 'SIDEBAR.PAID' | translate }}</a>
            </div>
          </div>

          <div class="menu-group">
            <div class="group-title">{{ 'NAV.ANALYTICS' | translate }}</div>
            <a routerLink="/analytics" routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: true }" (click)="closeLeftSidebar()"
               class="sidebar-link">
              {{ 'NAV.ANALYTICS' | translate }}
            </a>
          </div>
        </nav>
      </aside>

      <!-- Кнопка правого сайдбара -->
      <button class="right-sidebar-toggle" 
              (click)="toggleRightSidebar()" 
              [class.active]="rightSidebarOpen"
              aria-label="Открыть/закрыть иерархию">
        <div class="star-container">
          <div class="star-star">★</div>
          <div class="star-rays">
            <div class="ray ray-1"></div>
            <div class="ray ray-2"></div>
            <div class="ray ray-3"></div>
            <div class="ray ray-4"></div>
            <div class="ray ray-5"></div>
            <div class="ray ray-6"></div>
            <div class="ray ray-7"></div>
            <div class="ray ray-8"></div>
          </div>
          <div class="star-glow"></div>
          
          <!-- Частицы фейерверка -->
          <div class="firework-particles">
            <div class="particle particle-1"></div>
            <div class="particle particle-2"></div>
            <div class="particle particle-3"></div>
            <div class="particle particle-4"></div>
            <div class="particle particle-5"></div>
            <div class="particle particle-6"></div>
            <div class="particle particle-7"></div>
            <div class="particle particle-8"></div>
            <div class="particle particle-9"></div>
            <div class="particle particle-10"></div>
            <div class="particle particle-11"></div>
            <div class="particle particle-12"></div>
          </div>
        </div>
      </button>

      <!-- Right sidebar placeholder (hierarchy) -->
      <aside class="glass-sidebar right" [class.open]="rightSidebarOpen"
             aria-hidden="{{!rightSidebarOpen}}">
        <div class="right-sidebar-content">
          <div class="group-title">{{ 'SIDEBAR.HIERARCHY' | translate }}</div>
          <p>{{ 'SIDEBAR.HIERARCHY_DESC' | translate }}</p>
          <p>{{ 'SIDEBAR.HIERARCHY_FILTERS' | translate }}</p>
        </div>
      </aside>

      <div class="backdrop" *ngIf="leftSidebarOpen" (click)="closeLeftSidebar()"></div>
      <div class="backdrop" *ngIf="rightSidebarOpen" (click)="closeRightSidebar()"></div>

      <main class="glass-main">
        <div class="glass-content-panel">
          <router-outlet></router-outlet>
        </div>
      </main>

      <footer class="glass-footer" (click)="toggleBottomSidebar()">
        <p>&copy; 2025 {{ getTranslation('COMMON.APP_TITLE', 'Wone IT - Business Solutions - Project Management') }}. {{ getTranslation('COMMON.ALL_RIGHTS_RESERVED', 'Все права защищены') }}</p>
      </footer>
      
      <!-- Bottom sidebar for future features -->
      <aside class="glass-sidebar bottom" [class.open]="bottomSidebarOpen" aria-hidden="{{!bottomSidebarOpen}}">
        <div class="bottom-sidebar-content">
          <div class="bottom-sidebar-header">
            <h3>{{ 'SIDEBAR.BOTTOM_TITLE' | translate }}</h3>
            <button class="close-bottom-sidebar" (click)="closeBottomSidebar()">×</button>
          </div>
          <div class="bottom-sidebar-body">
            <p>{{ 'SIDEBAR.BOTTOM_DESC' | translate }}</p>
            <div class="bottom-sidebar-placeholder">
              <div class="placeholder-item">
                <span class="placeholder-icon">🚀</span>
                <span class="placeholder-text">{{ 'SIDEBAR.BOTTOM_PLACEHOLDER_1' | translate }}</span>
              </div>
              <div class="placeholder-item">
                <span class="placeholder-icon">💡</span>
                <span class="placeholder-text">{{ 'SIDEBAR.BOTTOM_PLACEHOLDER_2' | translate }}</span>
              </div>
              <div class="placeholder-item">
                <span class="placeholder-icon">🎯</span>
                <span class="placeholder-text">{{ 'SIDEBAR.BOTTOM_PLACEHOLDER_3' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      <div class="backdrop" *ngIf="bottomSidebarOpen" (click)="closeBottomSidebar()"></div>
    </div>

    <router-outlet *ngIf="!authState.isAuthenticated"></router-outlet>
  `,
  styles: [`
    .app-container {
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-left: 0;
      padding-top: 0; /* Убираем padding-top, так как хедер фиксированный */
    }
    
    .app-container.sidebar-open {
      margin-left: 260px; /* Сдвигаем контент вправо при открытии сайдбара */
    }
    
    .glass-header { 
      display: flex; 
      flex-direction: column;
      padding: 6px 20px 3px 20px; /* Уменьшили padding еще больше */
      margin-bottom: 6px; /* Уменьшили margin еще больше */
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%);
      backdrop-filter: blur(20px); 
      border-radius: 16px; /* Уменьшили border-radius */
      border: 2px solid rgba(59,130,246,0.2);
      box-shadow: 0 6px 24px rgba(59,130,246,0.15); /* Уменьшили shadow */
      gap: 6px; /* Уменьшили gap еще больше */
      position: fixed; /* Фиксируем хедер */
      top: 0;
      left: 0;
      right: 0;
      height: 110px; /* Высота хедера с учетом хлебных крошек */
      z-index: 999999;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Добавляем плавный переход */
    }
    
    .glass-header.sidebar-open {
      left: 260px; /* Сдвигаем хедер вправо при открытии сайдбара */
    }
    
    .header-top-row {
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      gap: 16px;
    }
    
    .left-group { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
    }
    

    
    .app-logo {
      width: 62px; /* Уменьшили в 1.2 раза с 75px */
      height: 62px; /* Уменьшили в 1.2 раза с 75px */
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(59,130,246,0.2));
      transition: all 0.2s ease;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    

    
    .center-group { 
      flex: 1; 
      display: flex; 
      justify-content: center; 
      max-width: 600px;
    }
    
    .right-group { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
    }
    
    .toggles { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
    }

    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .search-input { 
      width: 160px; /* Уменьшили с 180px */
      padding: 10px 14px; /* Уменьшили padding */
      border-radius: 16px; /* Уменьшили border-radius */
      border: 2px solid rgba(59,130,246,0.2); 
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(10px); 
      font-size: 13px; /* Уменьшили font-size */
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #1e293b;
      box-shadow: 0 2px 8px rgba(59,130,246,0.1);
    }
    
    .search-input:focus {
      outline: none;
      border-color: rgba(59,130,246,0.5);
      background: rgba(255,255,255,1);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1), 0 4px 16px rgba(59,130,246,0.2);
      width: 320px;
    }
    
    .search-input::placeholder {
      color: #9ca3af;
      font-style: italic;
    }
    
    /* Подсказки поиска */
    .search-suggestions,
    .search-history,
    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: rgba(255,255,255,0.98);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(59,130,246,0.2);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
      margin-top: 8px;
      z-index: 1000;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .suggestions-header,
    .history-header,
    .results-header {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(59,130,246,0.1);
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .suggestions-items,
    .history-items,
    .results-items {
      padding: 8px 0;
    }
    
    .suggestion-item,
    .history-item,
    .result-item {
      padding: 12px 16px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(59,130,246,0.05);
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .suggestion-item:last-child,
    .history-item:last-child,
    .result-item:last-child {
      border-bottom: none;
    }
    
    .suggestion-item:hover,
    .history-item:hover,
    .result-item:hover {
      background: rgba(59,130,246,0.05);
      transform: translateX(4px);
    }
    
    .suggestion-icon,
    .result-icon {
      font-size: 1.2rem;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }
    
    .suggestion-content,
    .result-content {
      flex: 1;
    }
    
    .suggestion-title,
    .result-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      margin-bottom: 2px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .suggestion-subtitle,
    .result-subtitle {
      color: #64748b;
      font-size: 0.85rem;
      margin-bottom: 2px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .suggestion-lang {
      color: #3b82f6;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(59,130,246,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .history-text {
      flex: 1;
      color: #1e293b;
      font-weight: 500;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .history-time {
      color: #94a3b8;
      font-size: 0.8rem;
      font-style: italic;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    .clear-history {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.8rem;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: pointer !important;
      caret-color: transparent !important;
    }
    
    .clear-history:hover {
      background: rgba(239,68,68,0.1);
      transform: scale(1.05);
    }
    
    .glass-select { 
      padding: 8px 12px; 
      border-radius: 10px;
      border: 2px solid rgba(59,130,246,0.2); 
      background: rgba(255,255,255,0.9); 
      color: #1e293b;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      caret-color: transparent !important;
    }
    
    .glass-select:hover {
      border-color: rgba(59,130,246,0.4);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59,130,246,0.15);
    }
    
    .glass-select:focus {
      outline: none;
      border-color: rgba(59,130,246,0.8);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
      transform: translateY(-1px);
    }

    .header-breadcrumbs { 
      font-size: 12px; 
      opacity: 0.9; 
      margin: 8px 0 0 0; 
      padding: 8px 0 0 0;
      color: #64748b;
      border-top: 1px solid rgba(59,130,246,0.1);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    
    .header-breadcrumbs a { 
      cursor: pointer; 
      text-decoration: none; 
      color: #3b82f6;
      transition: all 0.2s ease;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(59,130,246,0.05);
    }
    
    .header-breadcrumbs a:hover {
      color: #1d4ed8;
      background: rgba(59,130,246,0.1);
      transform: translateY(-1px);
    }
    
    .header-breadcrumbs span {
      color: #94a3b8;
      font-weight: 400;
    }
    
    .breadcrumbs { 
      font-size: 14px; 
      opacity: 0.8; 
      margin: 8px 0 16px; 
      padding: 0 24px;
      color: #475569;
    }
    
    .breadcrumbs a { 
      cursor: pointer; 
      text-decoration: underline; 
      color: #3b82f6;
      transition: color 0.2s ease;
      font-weight: 500;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      caret-color: transparent !important;
    }
    
    .breadcrumbs a:hover {
      color: #1d4ed8;
    }

    .glass-sidebar { 
      position: fixed; 
      top: 0; 
      bottom: 0; 
      width: 260px; /* Уменьшили с 300px */
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  background 0.3s ease,
                  backdrop-filter 0.3s ease; 
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.85) 50%, rgba(236,254,255,0.9) 100%); /* Красивый градиент */
      backdrop-filter: blur(2px); /* Установили явный блюр 2px */
      border-right: 2px solid rgba(59,130,246,0.25); 
      z-index: 1000; 
      padding: 20px 16px; /* Уменьшили padding */
      box-shadow: 0 8px 32px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1);
    }
    
    .glass-sidebar.right { 
      top: 110px; /* Начинаем ниже хедера с хлебными крошками */
      right: 0; 
      left: auto; 
      transform: translateX(100%); 
      border-right: 0;
      border-left: 2px solid rgba(59,130,246,0.3); 
      height: calc(100vh - 110px); /* Высота от хедера до низа экрана */
      width: 260px;
      z-index: 1000;
      padding: 20px 16px;
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.85) 50%, rgba(236,254,255,0.9) 100%);
      backdrop-filter: blur(2px);
      box-shadow: -4px 0 24px rgba(59,130,246,0.12);
    }

    /* Кнопка правого сайдбара */
    .right-sidebar-toggle {
      position: fixed;
      right: 0; /* Всегда прижата к правому краю */
      top: calc(110px + 35px); /* Позиционируем под хедером с хлебными крошками по центру */
      transform: none; /* Убираем translateY */
      z-index: 999;
      background: transparent; /* Полностью прозрачный фон */
      backdrop-filter: none; /* Убираем блюр */
      border: none; /* Убираем окантовку */
      border-radius: 50px 0 0 50px; /* Полукруглая */
      padding: 20px 16px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: none; /* Убираем тень */
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      min-width: 70px;
      min-height: 70px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      caret-color: transparent !important;
    }

    .right-sidebar-toggle:hover {
      transform: translateX(-2px);
    }

    .right-sidebar-toggle.active {
      right: 260px; /* Когда сайдбар открыт, кнопка прижата к его левой границе */
      border-radius: 0 50px 50px 0; /* Полукруглая справа */
    }

    /* Анимированная звездочка с фейерверком */
    .star-container {
      position: relative;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .star-star {
      font-size: 2.2rem;
      color: #ffd700; /* Золотистый цвет */
      text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8), 0 0 60px rgba(128, 0, 128, 0.6);
      animation: star-twinkle 4s ease-in-out infinite;
      z-index: 3;
      position: relative;
      filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: pointer !important;
      caret-color: transparent !important;
    }

    .star-rays {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .ray {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 30px;
      background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.8), rgba(255, 0, 0, 1), rgba(128, 0, 128, 0.8), transparent);
      transform-origin: center;
      animation: ray-firework 3s ease-in-out infinite;
      border-radius: 1px;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }

    .ray-1 { transform: translate(-50%, -50%) rotate(0deg); animation-delay: 0s; }
    .ray-2 { transform: translate(-50%, -50%) rotate(45deg); animation-delay: 0.1s; }
    .ray-3 { transform: translate(-50%, -50%) rotate(90deg); animation-delay: 0.2s; }
    .ray-4 { transform: translate(-50%, -50%) rotate(135deg); animation-delay: 0.3s; }
    .ray-5 { transform: translate(-50%, -50%) rotate(180deg); animation-delay: 0.4s; }
    .ray-6 { transform: translate(-50%, -50%) rotate(225deg); animation-delay: 0.5s; }
    .ray-7 { transform: translate(-50%, -50%) rotate(270deg); animation-delay: 0.6s; }
    .ray-8 { transform: translate(-50%, -50%) rotate(315deg); animation-delay: 0.7s; }

    .star-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 0, 0, 0.2) 30%, rgba(128, 0, 128, 0.1) 60%, transparent 80%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: glow-pulse 3s ease-in-out infinite;
      z-index: 0;
      filter: blur(0.5px);
    }

    @keyframes star-twinkle {
      0%, 100% { 
        opacity: 0.8; 
        transform: scale(1) rotate(0deg);
        filter: brightness(1) hue-rotate(0deg);
      }
      25% { 
        opacity: 1; 
        transform: scale(1.15) rotate(45deg);
        filter: brightness(1.4) hue-rotate(45deg);
      }
      50% { 
        opacity: 0.9; 
        transform: scale(0.9) rotate(90deg);
        filter: brightness(0.8) hue-rotate(90deg);
      }
      75% { 
        opacity: 1; 
        transform: scale(1.1) rotate(135deg);
        filter: brightness(1.3) hue-rotate(135deg);
      }
    }

    @keyframes ray-firework {
      0% { 
        opacity: 0;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(0.3);
        filter: brightness(0.5);
      }
      20% { 
        opacity: 1;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(1.2);
        filter: brightness(1.5);
      }
      40% { 
        opacity: 0.8;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(1);
        filter: brightness(1.2);
      }
      60% { 
        opacity: 0.6;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(0.8);
        filter: brightness(0.9);
      }
      80% { 
        opacity: 0.4;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(0.6);
        filter: brightness(0.7);
      }
      100% { 
        opacity: 0;
        transform: translate(-50%, -50%) rotate(var(--ray-angle, 0deg)) scale(0.4);
        filter: brightness(0.5);
      }
    }

    @keyframes glow-pulse {
      0%, 100% { 
        opacity: 0.2; 
        transform: translate(-50%, -50%) scale(1);
        filter: blur(1px);
      }
      50% { 
        opacity: 0.4; 
        transform: translate(-50%, -50%) scale(1.3);
        filter: blur(0.5px);
      }
    }

    /* Устанавливаем углы для лучей */
    .ray-1 { --ray-angle: 0deg; }
    .ray-2 { --ray-angle: 45deg; }
    .ray-3 { --ray-angle: 90deg; }
    .ray-4 { --ray-angle: 135deg; }
    .ray-5 { --ray-angle: 180deg; }
    .ray-6 { --ray-angle: 225deg; }
    .ray-7 { --ray-angle: 270deg; }
    .ray-8 { --ray-angle: 315deg; }

    /* Частицы фейерверка */
    .firework-particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 4;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle, #ffd700, #ff0000, #800080);
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: none;
    }

    .particle-1 { --particle-angle: 0deg; --particle-distance: 60px; }
    .particle-2 { --particle-angle: 30deg; --particle-distance: 55px; }
    .particle-3 { --particle-angle: 60deg; --particle-distance: 65px; }
    .particle-4 { --particle-angle: 90deg; --particle-distance: 50px; }
    .particle-5 { --particle-angle: 120deg; --particle-distance: 70px; }
    .particle-6 { --particle-angle: 150deg; --particle-distance: 45px; }
    .particle-7 { --particle-angle: 180deg; --particle-distance: 58px; }
    .particle-8 { --particle-angle: 210deg; --particle-distance: 52px; }
    .particle-9 { --particle-angle: 240deg; --particle-distance: 68px; }
    .particle-10 { --particle-angle: 270deg; --particle-distance: 48px; }
    .particle-11 { --particle-angle: 300deg; --particle-distance: 62px; }
    .particle-12 { --particle-angle: 330deg; --particle-distance: 54px; }

    /* Анимация фейерверка при клике */
    .right-sidebar-toggle:active .particle {
      animation: firework-explosion 0.8s ease-out forwards;
    }

    @keyframes firework-explosion {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(
          calc(-50% + var(--particle-distance) * cos(var(--particle-angle))),
          calc(-50% + var(--particle-distance) * sin(var(--particle-angle)))
        ) scale(0.3);
      }
    }
    
    .glass-sidebar.left { 
      left: 0; 
      top: 0; /* Начинаем с самого верха экрана */
      bottom: 0;
      width: 260px;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  background 0.3s ease,
                  backdrop-filter 0.3s ease; 
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.85) 50%, rgba(236,254,255,0.9) 100%);
      backdrop-filter: blur(2px);
      border-right: 2px solid rgba(59,130,246,0.25); 
      z-index: 1000; 
      padding: 20px 16px;
      box-shadow: 4px 0 24px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1);
    }
    

    
    .glass-sidebar.open { 
      transform: translateX(0); 
    }
    
    .glass-sidebar.bottom {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 300px;
      transform: translateY(100%);
      border-right: 0;
      border-left: 0;
      border-bottom: 0;
      border-top: 2px solid rgba(59,130,246,0.3);
      border-radius: 24px 24px 0 0;
      z-index: 1000;
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.85) 50%, rgba(236,254,255,0.9) 100%); /* Красивый градиент */
      backdrop-filter: blur(2px); /* Добавили блюр 2px */
      box-shadow: 0 -8px 32px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1);
    }
    
    .glass-sidebar.bottom.open {
      transform: translateY(0);
    }
    
    .bottom-sidebar-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 24px;
    }
    
    .bottom-sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(59,130,246,0.2);
    }
    
    .bottom-sidebar-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .close-bottom-sidebar {
      background: none;
      border: none;
      font-size: 2rem;
      color: #64748b;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-bottom-sidebar:hover {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      transform: scale(1.1);
    }
    
    .bottom-sidebar-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .bottom-sidebar-body p {
      margin: 0;
      color: #64748b;
      font-size: 1rem;
      line-height: 1.6;
    }
    
    .bottom-sidebar-placeholder {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    
    .placeholder-item {
      background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(59,130,246,0.15);
      padding: 20px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .placeholder-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(59,130,246,0.15);
      border-color: rgba(59,130,246,0.25);
    }
    
    .placeholder-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 12px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    
    .placeholder-text {
      font-size: 0.9rem;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sidebar-nav { 
      display: flex; 
      flex-direction: column; 
      gap: 16px; 
    }
    
    .menu-group { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
    }
    
    .group-title { 
      font-weight: 700; 
      font-size: 12px; 
      opacity: 0.8; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      color: #3b82f6;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }

    .sidebar-link { 
      text-decoration: none; 
      color: #1e293b; 
      font-weight: 600; 
      padding: 12px 16px;
      border-radius: 12px; 
      background: rgba(255,255,255,0.9); 
      border: 2px solid rgba(59,130,246,0.2);
      transition: all 0.2s ease; 
      font-size: 14px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: pointer !important;
      caret-color: transparent !important;
    }
    
    .sidebar-link:hover { 
      background: rgba(59,130,246,0.1); 
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59,130,246,0.15);
      border-color: rgba(59,130,246,0.4);
    }
    
    .sidebar-link.active { 
      outline: 2px solid rgba(59,130,246,0.8); 
      background: rgba(59,130,246,0.15); 
      border-color: rgba(59,130,246,0.4);
      color: #1d4ed8;
    }

    .submenu { 
      display: flex; 
      flex-direction: column; 
      gap: 6px; 
      padding-left: 16px; 
      margin-top: 8px;
    }
    
    .sidebar-sublink { 
      text-decoration: none; 
      color: #475569; 
      font-weight: 500; 
      padding: 8px 12px;
      border-radius: 10px; 
      background: rgba(248,250,252,0.8); 
      border: 1px solid rgba(59,130,246,0.2);
      transition: all 0.2s ease; 
      font-size: 13px;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: pointer !important;
      caret-color: transparent !important;
    }
    
    .sidebar-sublink:hover { 
      background: rgba(59,130,246,0.1); 
      color: #1e293b;
      border-color: rgba(59,130,246,0.3);
    }

    .right-sidebar-content { 
      display: flex; 
      flex-direction: column; 
      gap: 12px; 
      padding: 16px;
    }

    .backdrop { 
      position: fixed; 
      inset: 0; 
      z-index: 900; 
      background: rgba(15,23,42,0.4);
      backdrop-filter: blur(4px); 
    }

    .glass-title { 
      margin: 0; 
      font-size: 1.2rem; /* Уменьшили с 1.4rem */
      font-weight: 700; 
      background: linear-gradient(135deg, #1e293b 0%, #3b82f6 25%, #1d4ed8 50%, #3b82f6 75%, #3b82f6 100%);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titleGradient 8s ease-in-out infinite;
      text-shadow: 0 2px 8px rgba(59,130,246,0.15);
      filter: drop-shadow(0 1px 3px rgba(59,130,246,0.2));
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    @keyframes titleGradient {
      0%, 100% {
        background-position: 0% 50%;
      }
      25% {
        background-position: 100% 50%;
      }
      50% {
        background-position: 50% 100%;
      }
      75% {
        background-position: 50% 0%;
      }
    }
    
    .glass-main { 
      min-height: calc(100vh - 200px); 
      padding: 120px 24px 60px 24px; /* Отступ сверху для хедера с хлебными крошками */
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 1;
    }
    
    .glass-content-panel {
      background: linear-gradient(135deg, rgba(255,255,255,var(--forms-transparency, 0.75)) 0%, rgba(248,250,252,var(--forms-transparency, 0.75)) 100%);
      backdrop-filter: blur(var(--forms-blur, 4px));
      border-radius: 20px;
      border: 2px solid rgba(59,130,246,0.2);
      box-shadow: 0 8px 32px rgba(59,130,246,0.08);
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
      transition: background 0.3s ease, backdrop-filter 0.3s ease;
    }
    
    .glass-footer { 
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center; 
      padding: 6px 24px; 
      margin: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.7) 100%);
      backdrop-filter: blur(10px); 
      border-radius: 0;
      border-top: 1px solid rgba(59,130,246,0.15);
      box-shadow: 0 -2px 8px rgba(59,130,246,0.08);
      font-size: 12px;
      color: #64748b;
      z-index: 100;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-footer:hover {
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
      border-top-color: rgba(59,130,246,0.25);
      box-shadow: 0 -4px 16px rgba(59,130,246,0.15);
    }
    
    .glass-footer:active {
      transform: translateY(1px);
    }
    
    .glass-footer p {
      margin: 0;
      font-size: 11px;
      line-height: 1.2;
      pointer-events: none;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }

    .glass-button { 
      padding: 10px 16px; 
      border: none; 
      border-radius: 12px; 
      background: linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 100%);
      color: #ffffff; 
      cursor: pointer; 
      transition: all 0.2s ease; 
      border: 2px solid rgba(59,130,246,0.3);
      font-weight: 600;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      caret-color: transparent !important;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(59,130,246,0.2);
    }
    
    .glass-button:hover { 
      background: linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(37,99,235,1) 100%); 
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      border-color: rgba(59,130,246,0.5);
    }
    
    /* Убираем курсор на неинтерактивных элементах */
    .glass-button,
    .sidebar-link,
    .sidebar-sublink,
    .dropdown-item {
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    
    /* Убираем выделение текста для лейблов и заголовков */
    .group-title,
    .glass-title,
    .app-logo,
    .suggestion-item,
    .history-item,
    .result-item,
    .breadcrumbs a,
    .suggestion-title,
    .suggestion-subtitle,
    .suggestion-lang,
    .result-title,
    .result-subtitle,
    .history-text,
    .history-time,
    .suggestions-header,
    .history-header,
    .results-header,
    .user-info,
    .dropdown-arrow,
    .glass-footer p {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
      cursor: default !important;
      caret-color: transparent !important;
    }
    
    /* Убираем outline и курсор на фокусе для кнопок */
    .glass-button:focus,
    .sidebar-link:focus,
    .sidebar-sublink:focus,
    .dropdown-item:focus {
      outline: none;
      cursor: pointer;
    }
    
    /* Убираем выделение текста при клике */
    .glass-button,
    .sidebar-link,
    .sidebar-sublink,
    .dropdown-item,
    .history-item,
    .result-item,
    .breadcrumbs a {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    
    .glass-user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 999999;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .user-dropdown {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%);
      border: 2px solid rgba(59,130,246,0.2);
      box-shadow: 0 4px 16px rgba(59,130,246,0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      z-index: 999999;
      overflow: hidden;
    }
    
    .user-dropdown::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.8s ease;
    }
    
    .user-dropdown:hover::before {
      left: 100%;
    }
    
    /* Дополнительное переливание для светлой темы */
    .user-dropdown::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(59,130,246,0.05) 0%, 
        rgba(37,99,235,0.05) 25%, 
        rgba(59,130,246,0.05) 50%, 
        rgba(37,99,235,0.05) 75%, 
        rgba(59,130,246,0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .user-dropdown:hover::after {
      opacity: 1;
    }
    
    .user-dropdown:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59,130,246,0.25);
      border-color: rgba(59,130,246,0.4);
    }
    
    .user-dropdown:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(59,130,246,0.2);
    }
    
    .user-info {
      font-weight: 700;
      color: #1e293b;
      font-size: 14px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      letter-spacing: 0.3px;
    }
    
    .dropdown-arrow {
      font-size: 12px;
      color: #3b82f6;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: bold;
    }
    
    .user-dropdown.open .dropdown-arrow {
      transform: rotate(180deg);
      color: #1d4ed8;
    }
    
    .user-dropdown:hover .dropdown-arrow {
      color: #1d4ed8;
    }
    
    .user-dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: rgba(255,255,255,0.98);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 2px solid rgba(59,130,246,0.25);
      box-shadow: 0 12px 40px rgba(59,130,246,0.2);
      padding: 8px 0;
      min-width: 160px;
      z-index: 999999;
      margin-top: 8px;
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
      animation: dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      transform-origin: top right;
      pointer-events: auto;
      overflow: hidden;
      width: 100%;
      min-width: 200px;
    }
    
    .user-dropdown-menu::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent);
    }
    
    @keyframes dropdownSlideIn {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .dropdown-item {
      padding: 12px 20px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: rgba(30, 41, 59, 0.8);
      font-size: 14px;
      font-weight: 600;
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .dropdown-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent);
      transition: left 0.5s ease;
    }
    
    .dropdown-item:hover::before {
      left: 100%;
    }
    
    /* Дополнительное переливание для элементов меню в светлой теме */
    .dropdown-item::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(59,130,246,0.03) 0%, 
        rgba(37,99,235,0.03) 50%, 
        rgba(59,130,246,0.03) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .dropdown-item:hover::after {
      opacity: 1;
    }
    
    .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%);
      color: #1d4ed8;
      transform: translateX(4px);
      backdrop-filter: blur(15px);
      box-shadow: 0 2px 8px rgba(59,130,246,0.1);
    }
    
    .dropdown-item:active {
      transform: translateX(2px);
      background: rgba(59,130,246,0.2);
    }
    
    .dropdown-item:first-child {
      border-radius: 14px 14px 0 0;
    }
    
    .dropdown-item:last-child {
      border-radius: 0 0 14px 14px;
    }

    .hide-on-mobile { 
      display: none; 
    }
    
    @media (min-width: 900px) { 
      .hide-on-mobile { 
        display: flex; 
      } 
    }

    :host-context(.theme-dark) .glass-header, 
    :host-context(.theme-dark) .glass-sidebar,
    :host-context(.theme-dark) .glass-content-panel { 
      background: linear-gradient(135deg, rgba(15,23,42,var(--sidebars-transparency, 0.98)) 0%, rgba(30,41,59,var(--sidebars-transparency, 0.98)) 100%); 
      border-color: rgba(59,130,246,0.3); 
    }
    
    :host-context(.theme-dark) .glass-sidebar.bottom {
      background: linear-gradient(135deg, rgba(15,23,42,var(--sidebars-transparency, 0.98)) 0%, rgba(30,41,59,var(--sidebars-transparency, 0.98)) 100%);
      border-top-color: rgba(59,130,246,0.4);
    }
    
    :host-context(.theme-dark) .bottom-sidebar-header h3 {
      background: linear-gradient(135deg, #f8fafc 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    :host-context(.theme-dark) .bottom-sidebar-body p {
      color: #94a3b8;
    }
    
    :host-context(.theme-dark) .placeholder-item {
      background: linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%);
      border-color: rgba(59,130,246,0.25);
    }
    
    :host-context(.theme-dark) .placeholder-text {
      color: #cbd5e1;
    }
    
    :host-context(.theme-dark) .glass-footer {
      background: linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(30,41,59,0.7) 100%);
      border-top-color: rgba(59,130,246,0.2);
      color: #94a3b8;
    }
    
    :host-context(.theme-dark) .header-breadcrumbs {
      border-top-color: rgba(59,130,246,0.2);
      color: #94a3b8;
    }
    
    :host-context(.theme-dark) .header-breadcrumbs a {
      color: #60a5fa;
      background: rgba(59,130,246,0.1);
    }
    
    :host-context(.theme-dark) .header-breadcrumbs a:hover {
      color: #93c5fd;
      background: rgba(59,130,246,0.2);
    }
    
    :host-context(.theme-dark) .search-suggestions,
    :host-context(.theme-dark) .search-history,
    :host-context(.theme-dark) .search-results {
      background: rgba(15,23,42,0.98);
      border-color: rgba(59,130,246,0.3);
    }
    
    :host-context(.theme-dark) .suggestions-header,
    :host-context(.theme-dark) .history-header,
    :host-context(.theme-dark) .results-header {
      color: #e5e7eb;
      border-bottom-color: rgba(59,130,246,0.2);
    }
    
    :host-context(.theme-dark) .suggestion-item:hover,
    :host-context(.theme-dark) .history-item:hover,
    :host-context(.theme-dark) .result-item:hover {
      background: rgba(59,130,246,0.1);
    }
    
    :host-context(.theme-dark) .suggestion-title,
    :host-context(.theme-dark) .result-title,
    :host-context(.theme-dark) .history-text {
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .suggestion-subtitle,
    :host-context(.theme-dark) .result-subtitle {
      color: #cbd5e1;
    }
    

    
    :host-context(.theme-dark) .glass-title { 
      background: linear-gradient(135deg, #f8fafc 0%, #60a5fa 25%, #93c5fd 50%, #60a5fa 75%, #f8fafc 100%);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titleGradient 8s ease-in-out infinite;
      text-shadow: 0 2px 8px rgba(96,165,250,0.2);
      filter: drop-shadow(0 1px 3px rgba(96,165,250,0.3));
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    
    :host-context(.theme-dark) .user-info { 
      color: #f8fafc; 
    }
    
    :host-context(.theme-dark) .sidebar-link, 
    :host-context(.theme-dark) .sidebar-sublink {
      color: #f8fafc; 
      background: rgba(30,41,59,0.9); 
      border-color: rgba(59,130,246,0.3);
    }
    
    :host-context(.theme-dark) .glass-button { 
      color: #f8fafc; 
      background: linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 100%);
      border-color: rgba(59,130,246,0.4); 
    }
    
    :host-context(.theme-dark) .user-dropdown {
      background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%);
      border-color: rgba(59,130,246,0.3);
      box-shadow: 0 4px 16px rgba(59,130,246,0.2);
    }
    
    :host-context(.theme-dark) .user-dropdown:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.25) 100%);
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 8px 24px rgba(59,130,246,0.35);
    }
    
    :host-context(.theme-dark) .user-info {
      color: #f8fafc;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    :host-context(.theme-dark) .dropdown-arrow {
      color: #60a5fa;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    :host-context(.theme-dark) .user-dropdown:hover .dropdown-arrow {
      color: #93c5fd;
    }
    
    :host-context(.theme-dark) .user-dropdown-menu {
      background: rgba(15,23,42,0.98);
      border-color: rgba(59,130,246,0.4);
      box-shadow: 0 12px 40px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.1);
      backdrop-filter: blur(25px);
    }
    
    :host-context(.theme-dark) .user-dropdown-menu::before {
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
    }
    
    :host-context(.theme-dark) .dropdown-item {
      color: #f8fafc;
      background: rgba(30,41,59,0.6);
      border-bottom: 1px solid rgba(59,130,246,0.1);
    }
    
    :host-context(.theme-dark) .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
      color: #93c5fd;
      box-shadow: 0 2px 8px rgba(59,130,246,0.2);
    }
    
    :host-context(.theme-dark) .dropdown-item::before {
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent);
    }
    
    :host-context(.theme-dark) .search-input {
      background: rgba(30,41,59,0.9);
      border-color: rgba(59,130,246,0.3);
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .glass-select {
      background: rgba(30,41,59,0.9);
      border-color: rgba(59,130,246,0.3);
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .group-title {
      color: #60a5fa;
    }
    
    :host-context(.theme-dark) .breadcrumbs {
      color: #94a3b8;
    }
    
    :host-context(.theme-dark) .breadcrumbs a {
      color: #60a5fa;
    }
    
    :host-context(.theme-dark) .breadcrumbs a:hover {
      color: #93c5fd;
    }
    
    /* Дополнительные стили для темной темы - исправление фона */
    :host-context(.theme-dark) .user-dropdown-menu {
      background: rgba(15,23,42,0.98) !important;
      border-color: rgba(59,130,246,0.4) !important;
      backdrop-filter: blur(25px) !important;
    }
    
    :host-context(.theme-dark) .dropdown-item {
      background: rgba(30,41,59,0.8) !important;
      border-bottom: 1px solid rgba(59,130,246,0.1) !important;
    }
    
    :host-context(.theme-dark) .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.25) 100%) !important;
    }
    
    /* Стили для класса .theme-dark (альтернативный способ) */
    .theme-dark .user-dropdown-menu {
      background: rgba(15,23,42,0.98) !important;
      border-color: rgba(59,130,246,0.4) !important;
      backdrop-filter: blur(25px) !important;
      width: 100% !important;
      min-width: 200px !important;
    }
    
    .theme-dark .dropdown-item {
      background: rgba(30,41,59,0.8) !important;
      border-bottom: 1px solid rgba(59,130,246,0.1) !important;
      color: #f8fafc !important;
    }
    
    .theme-dark .dropdown-item:hover {
      background: linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.25) 100%) !important;
      color: #93c5fd !important;
    }
  `]
})
export class AppComponent implements OnInit {
  authState: AuthState = { isAuthenticated: false, currentUser: null, token: null };
  leftSidebarOpen = false;
  rightSidebarOpen = false;
  bottomSidebarOpen = false;
  userMenuOpen = false;
  currentLang = 'ru';
  theme: 'light' | 'dark' = 'light';
  breadcrumbs: string[] = [];
  
  // UI настройки
  uiSettings: any = {};
  
  // Поиск
  searchQuery = '';
  searchHistory: string[] = [];
  searchResults: any[] = [];
  searchSuggestions: any[] = [];
  showSearchHistory = false;
  showSearchResults = false;
  showSuggestions = false;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {
    this.translate.setDefaultLang('ru');
    this.translate.use('ru');
    
    // Добавляем fallback для переводов
    this.translate.setTranslation('ru', {
      COMMON: {
        APP_TITLE: 'Business Solutions',
        ALL_RIGHTS_RESERVED: 'Все права защищены'
      },
      NAV: {
        DASHBOARD: 'Дашборд',
        PROJECTS: 'Проекты',
        EMPLOYEES: 'Сотрудники',
        ANALYTICS: 'Аналитика',
        INVOICES: 'Счета'
      },
      AUTH: {
        LOGOUT: 'Выйти'
      },
      HEADER: {
        MENU: 'Меню',
        SEARCH: 'Поиск...',
        THEME_LIGHT: 'Темная тема',
        THEME_DARK: 'Светлая тема',
        HIERARCHY: 'Иерархия',
        GO_TO_DASHBOARD: 'Перейти на дашборд',
        LOGO_CLICK: 'Кликните для перехода на главную страницу',
        TITLE_CLICK: 'Кликните для перехода на главную страницу'
      },
      SIDEBAR: {
        ACTIVE: 'Активные',
        PLANNING: 'Планирование',
        COMPLETED: 'Завершённые',
        SENT: 'Отправленные',
        OVERDUE: 'Просроченные',
        PAID: 'Оплаченные',
        HIERARCHY: 'Иерархия',
        HIERARCHY_DESC: 'Здесь будет иерархический список: Направления → Проекты.',
        HIERARCHY_FILTERS: 'Фильтры и быстрый выбор появятся позже.'
      },
      DASHBOARD: {
        PROJECTS: 'Проекты',
        TOTAL_PROJECTS: 'Всего проектов',
        EMPLOYEES: 'Сотрудники',
        TOTAL_EMPLOYEES: 'Всего сотрудников',
        REVENUE: 'Выручка',
        TOTAL_REVENUE: 'Общая выручка',
        MARGIN: 'Маржа',
        TOTAL_MARGIN: 'Общая маржа'
      },
      USER: {
        PROFILE: 'Профиль',
        SETTINGS: 'Настройки'
      }
    });
    
    // Добавляем английские переводы
    this.translate.setTranslation('en', {
      COMMON: {
        APP_TITLE: 'Business Solutions',
        ALL_RIGHTS_RESERVED: 'All rights reserved'
      },
      NAV: {
        DASHBOARD: 'Dashboard',
        PROJECTS: 'Projects',
        EMPLOYEES: 'Employees',
        ANALYTICS: 'Analytics',
        INVOICES: 'Invoices'
      },
      AUTH: {
        LOGOUT: 'Logout'
      },
      HEADER: {
        MENU: 'Menu',
        SEARCH: 'Search...',
        THEME_LIGHT: 'Dark theme',
        THEME_DARK: 'Light theme',
        HIERARCHY: 'Hierarchy',
        GO_TO_DASHBOARD: 'Go to Dashboard',
        LOGO_CLICK: 'Click to go to main page',
        TITLE_CLICK: 'Click to go to main page'
      },
      SIDEBAR: {
        ACTIVE: 'Active',
        PLANNING: 'Planning',
        COMPLETED: 'Completed',
        SENT: 'Sent',
        OVERDUE: 'Overdue',
        PAID: 'Paid',
        HIERARCHY: 'Hierarchy',
        HIERARCHY_DESC: 'Hierarchical list will be here: Directions → Projects.',
        HIERARCHY_FILTERS: 'Filters and quick selection will appear later.'
      },
      DASHBOARD: {
        PROJECTS: 'Projects',
        TOTAL_PROJECTS: 'Total Projects',
        EMPLOYEES: 'Employees',
        TOTAL_EMPLOYEES: 'Total Employees',
        REVENUE: 'Revenue',
        TOTAL_REVENUE: 'Total Revenue',
        MARGIN: 'Margin',
        TOTAL_MARGIN: 'Total Margin'
      },
      USER: {
        PROFILE: 'Profile',
        SETTINGS: 'Settings'
      }
    });
  }

  ngOnInit(): void {
    this.authService.authState$.subscribe(state => { this.authState = state; });
    this.router.events.subscribe(() => this.updateBreadcrumbs());
    this.updateBreadcrumbs();
    
    // Подписываемся на UI настройки
    this.userSettingsService.settings$.subscribe(settings => {
      this.uiSettings = settings.ui;
      this.applyUISettings();
    });
    
    // Загружаем текущие настройки
    const currentSettings = this.userSettingsService.getSettings();
    this.uiSettings = currentSettings.ui;
    this.applyUISettings();
    
    // Загружаем сохраненный язык
    if (currentSettings.ui.language) {
      this.currentLang = currentSettings.ui.language;
      this.translate.use(currentSettings.ui.language);
    }
    
    // Загружаем сохраненную тему
    if (currentSettings.ui.theme) {
      this.theme = currentSettings.ui.theme;
      const host = document.querySelector('body');
      if (host) { 
        host.classList.toggle('theme-dark', this.theme === 'dark'); 
      }
    }
    
    // Принудительно загружаем переводы
    this.translate.reloadLang('ru');
    this.translate.reloadLang('en');
    
    // Логируем состояние переводов
    console.log('Current language:', this.translate.currentLang);
    console.log('Available languages:', this.translate.getLangs());
    
    // Проверяем, что переводы загружены
    this.translate.get('COMMON.APP_TITLE').subscribe(
      (value) => console.log('Translation loaded:', value),
      (error) => console.error('Translation error:', error)
    );
    
    // Добавляем обработчик клика вне меню для его закрытия
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.glass-user-menu')) {
        this.closeUserMenu();
      }
      
      // Убираем текстовый курсор после клика на неедактируемых элементах
      if (target && !target.matches('input, textarea, select, [contenteditable="true"]')) {
        setTimeout(() => {
          if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
          }
          target.blur();
          document.body.focus();
        }, 1);
      }
    });
    
    // Обработчик изменения размера окна убран, так как используется relative позиционирование
  }

  async onLogout(): Promise<void> { await this.authService.logout(); this.router.navigate(['/login']); }

  toggleLeftSidebar(): void { this.leftSidebarOpen = !this.leftSidebarOpen; }
  closeLeftSidebar(): void { this.leftSidebarOpen = false; }

  toggleRightSidebar(): void { this.rightSidebarOpen = !this.rightSidebarOpen; }
  closeRightSidebar(): void { this.rightSidebarOpen = false; }
  
  toggleBottomSidebar(): void { this.bottomSidebarOpen = !this.bottomSidebarOpen; }
  closeBottomSidebar(): void { this.bottomSidebarOpen = false; }
  
  toggleUserMenu(): void { 
    if (this.userMenuOpen) {
      this.closeUserMenu();
    } else {
      this.userMenuOpen = true;
    }
  }
  
  closeUserMenu(): void { 
    this.userMenuOpen = false;
  }

  changeLang(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    
    // Сохраняем язык в настройках пользователя
    this.userSettingsService.updateSection('ui', { language: lang as 'ru' | 'en' });
  }

  applyUISettings(): void {
    // Применяем настройки прозрачности и блюра к CSS переменным
    if (this.uiSettings.transparency && this.uiSettings.blur) {
      console.log('Applying UI settings:', this.uiSettings);
      
      document.documentElement.style.setProperty(
        '--forms-transparency', 
        `${this.uiSettings.transparency.forms}%`
      );
      document.documentElement.style.setProperty(
        '--widgets-transparency', 
        `${this.uiSettings.transparency.widgets}%`
      );
      document.documentElement.style.setProperty(
        '--sidebars-transparency', 
        `${this.uiSettings.transparency.sidebars}%`
      );
      document.documentElement.style.setProperty(
        '--forms-blur', 
        `${this.uiSettings.blur.forms}px`
      );
      document.documentElement.style.setProperty(
        '--widgets-blur', 
        `${this.uiSettings.blur.widgets}px`
      );
      document.documentElement.style.setProperty(
        '--sidebars-blur', 
        `${this.uiSettings.blur.sidebars}px`
      );
      
      // Принудительно обновляем стили
      document.documentElement.style.setProperty('--force-update', Date.now().toString());
    }
  }

  onLangChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) { 
      this.changeLang(value);
      // Обновляем хлебные крошки при смене языка
      setTimeout(() => {
        this.updateBreadcrumbs();
      }, 100);
    }
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    const host = document.querySelector('body');
    if (host) { host.classList.toggle('theme-dark', this.theme === 'dark'); }
    
    // Сохраняем тему в настройки пользователя
    this.userSettingsService.updateSection('ui', { theme: this.theme });
  }

  onSearch(ev: any): void {
    const q = (ev?.target?.value || '').trim();
    this.searchQuery = q;
    
    if (q.length < 2) {
      this.showSuggestions = false;
      this.showSearchResults = false;
      return;
    }
    
    // Генерируем подсказки на основе введенного текста
    this.generateSearchSuggestions(q);
    this.showSuggestions = true;
    this.showSearchResults = false;
  }
  
  onSearchFocus(): void {
    if (this.searchQuery.length >= 2) {
      this.generateSearchSuggestions(this.searchQuery);
      this.showSuggestions = true;
    } else if (this.searchHistory.length > 0) {
      this.showSearchHistory = true;
    }
  }
  
  onSearchBlur(): void {
    // Небольшая задержка для возможности клика по элементам
    setTimeout(() => {
      this.showSuggestions = false;
      this.showSearchHistory = false;
      this.showSearchResults = false;
    }, 200);
  }
  
  generateSearchSuggestions(query: string): void {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Поиск по разделам и подразделам на всех языках
    const searchableItems = [
      { title: 'Дашборд', subtitle: 'Dashboard', icon: '📊', language: 'RU/EN', route: '/dashboard' },
      { title: 'Проекты', subtitle: 'Projects', icon: '🚀', language: 'RU/EN', route: '/projects' },
      { title: 'Активные проекты', subtitle: 'Active Projects', icon: '🟢', language: 'RU/EN', route: '/projects?filter=active' },
      { title: 'Планирование', subtitle: 'Planning', icon: '📋', language: 'RU/EN', route: '/projects?filter=planning' },
      { title: 'Завершённые', subtitle: 'Completed', icon: '✅', language: 'RU/EN', route: '/projects?filter=completed' },
      { title: 'Сотрудники', subtitle: 'Employees', icon: '👥', language: 'RU/EN', route: '/employees' },
      { title: 'Аналитика', subtitle: 'Analytics', icon: '📈', language: 'RU/EN', route: '/analytics' },
      { title: 'Счета', subtitle: 'Invoices', icon: '💰', language: 'RU/EN', route: '/invoices' },
      { title: 'Отправленные', subtitle: 'Sent', icon: '📤', language: 'RU/EN', route: '/invoices?status=sent' },
      { title: 'Просроченные', subtitle: 'Overdue', icon: '⚠️', language: 'RU/EN', route: '/invoices?status=overdue' },
      { title: 'Оплаченные', subtitle: 'Paid', icon: '💳', language: 'RU/EN', route: '/invoices?status=paid' }
    ];
    
    // Фильтруем по запросу (поиск на русском и английском)
    const filtered = searchableItems.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.subtitle.toLowerCase().includes(queryLower) ||
      item.title.toLowerCase().includes(queryLower) ||
      item.subtitle.toLowerCase().includes(queryLower)
    );
    
    this.searchSuggestions = filtered.slice(0, 8); // Максимум 8 подсказок
  }
  
  selectSuggestion(suggestion: any): void {
    this.searchQuery = suggestion.title;
    this.showSuggestions = false;
    this.addToSearchHistory(suggestion.title);
    this.router.navigate([suggestion.route]);
  }
  
  selectHistoryItem(item: string): void {
    this.searchQuery = item;
    this.showSearchHistory = false;
    this.generateSearchSuggestions(item);
    this.showSuggestions = true;
  }
  
  addToSearchHistory(query: string): void {
    if (!this.searchHistory.includes(query)) {
      this.searchHistory.unshift(query);
      this.searchHistory = this.searchHistory.slice(0, 10); // Максимум 10 элементов
    }
  }
  
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.showSearchHistory = false;
  }
  
  getTimeAgo(query: string): string {
    // Простая реализация - в реальном приложении здесь будет timestamp
    return 'Недавно';
  }
  
  navigateToSearchResult(result: any): void {
    // TODO: implement navigation to search result
    console.log('Navigate to:', result);
    this.showSearchResults = false;
  }
  
  onProfile(): void {
    // TODO: navigate to profile page
    console.log('Profile clicked');
    this.closeUserMenu();
  }
  
  onSettings(): void {
    this.router.navigate(['/settings']);
    this.closeUserMenu();
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url || '/';
    const parts = url.split('?')[0].split('/').filter(Boolean);
    
    // Используем переводы для хлебных крошек
    const breadcrumbMap: { [key: string]: string } = {
      'dashboard': this.getTranslation('BREADCRUMBS.DASHBOARD', 'Дашборд'),
      'projects': this.getTranslation('BREADCRUMBS.PROJECTS', 'Проекты'),
      'employees': this.getTranslation('BREADCRUMBS.EMPLOYEES', 'Сотрудники'),
      'analytics': this.getTranslation('BREADCRUMBS.ANALYTICS', 'Аналитика'),
      'invoices': this.getTranslation('BREADCRUMBS.INVOICES', 'Счета'),
      'login': this.getTranslation('AUTH.LOGIN_TITLE', 'Вход')
    };
    
    this.breadcrumbs = parts.length ? 
      parts.map(part => breadcrumbMap[part] || part) : 
      [this.getTranslation('BREADCRUMBS.DASHBOARD', 'Дашборд')];
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    // Закрываем левый сайдбар при переходе на дашборд
    this.closeLeftSidebar();
  }
  
  navigateTo(index: number): void {
    const path = '/' + this.breadcrumbs.slice(0, index + 1).join('/');
    this.router.navigate([path]);
  }
  
  getTranslation(key: string, fallback: string): string {
    const translation = this.translate.instant(key);
    return translation !== key ? translation : fallback;
  }
}
