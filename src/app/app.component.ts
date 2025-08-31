import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppLayout } from './layout/component/app.layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AppLayout],
  template: `
    <app-layout></app-layout>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Analytics Portal v2.0';
  
  // Сигналы для управления состоянием
  private currentLanguage = signal<string>('ru');
  private isDarkMode = signal<boolean>(false);
  
  // Вычисляемые свойства
  public readonly language = computed(() => this.currentLanguage());
  public readonly darkMode = computed(() => this.isDarkMode());

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    // Инициализация переводов
    this.translate.setDefaultLang('ru');
    this.translate.use('ru');
    
    // Инициализация темы
    this.initializeTheme();
    
    // Инициализация языка
    this.initializeLanguage();
  }

  private initializeTheme(): void {
    // Проверяем сохраненную тему или системные настройки
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this.setTheme(shouldUseDark);
  }

  private initializeLanguage(): void {
    // Проверяем сохраненный язык
    const savedLanguage = localStorage.getItem('language') || 'ru';
    this.setLanguage(savedLanguage);
  }

  public setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('app-dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('app-dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  public setLanguage(lang: string): void {
    this.currentLanguage.set(lang);
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    
    // Обновляем атрибут языка для HTML
    document.documentElement.lang = lang;
  }

  public toggleTheme(): void {
    this.setTheme(!this.darkMode());
  }

  public toggleLanguage(): void {
    const newLang = this.language() === 'ru' ? 'en' : 'ru';
    this.setLanguage(newLang);
  }
}
