import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { UserSettingsService } from '../../services/user-settings.service';
import * as THREE from 'three';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="login-container" [class.theme-dark]="currentTheme === 'dark'" [class.theme-light]="currentTheme === 'light'">
      <!-- 3D точки и волны на фоне -->
      <canvas #landscapeCanvas class="landscape-background"></canvas>
      
      <!-- Переключатели темы и языка -->
      <div class="login-controls">
        <div class="control-group">
          <button class="theme-toggle" (click)="toggleTheme()" [title]="currentTheme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'">
            {{ currentTheme === 'light' ? '🌙' : '☀️' }}
          </button>
          <select class="language-select" [value]="currentLang" (change)="onLangChange($event)">
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
      </div>

      <div class="login-card glassmorphism-enhanced">
        <div class="login-header">
          <h1 class="login-title">{{ 'AUTH.LOGIN_TITLE' | translate }}</h1>
          <p class="login-subtitle">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
        </div>

        <form class="login-form" (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email" class="form-label">{{ 'AUTH.EMAIL' | translate }}</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              class="form-input glassmorphism-input"
              placeholder="{{ 'AUTH.EMAIL_PLACEHOLDER' | translate }}"
              [class.error]="showError && !email"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">{{ 'AUTH.PASSWORD' | translate }}</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              class="form-input glassmorphism-input"
              placeholder="{{ 'AUTH.PASSWORD_PLACEHOLDER' | translate }}"
              [class.error]="showError && !password"
            />
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary glassmorphism-btn"
              [disabled]="isLoading"
            >
              <span *ngIf="!isLoading">{{ 'AUTH.LOGIN_BUTTON' | translate }}</span>
              <span *ngIf="isLoading">{{ 'AUTH.LOGGING_IN' | translate }}</span>
            </button>
          </div>


        </form>

        <div *ngIf="errorMessage" class="error-message glassmorphism-error">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message glassmorphism-success">
          {{ successMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
      /* Устанавливаем темную тему по умолчанию для предотвращения мелькания */
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    }

    /* Темная тема */
    .login-container.theme-dark {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    }

    /* Светлая тема */
    .login-container.theme-light {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%);
    }

    /* 3D ландшафт на фоне */
    .landscape-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* Переключатели темы и языка */
    .login-controls {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 20;
    }

    .control-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .theme-toggle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .language-select {
      padding: 8px 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      backdrop-filter: blur(3px);
    }

    /* Стили переключателей для темной темы */
    .theme-dark .theme-toggle {
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #f8fafc;
    }

    .theme-dark .theme-toggle:hover {
      background: rgba(59, 130, 246, 0.2);
      transform: scale(1.05);
    }

    .theme-dark .language-select {
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #f8fafc;
    }

    .theme-dark .language-select:hover {
      background: rgba(59, 130, 246, 0.2);
    }

    /* Стили переключателей для светлой темы */
    .theme-light .theme-toggle {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #1e293b;
    }

    .theme-light .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: scale(1.05);
    }

    .theme-light .language-select {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: #1e293b;
    }

    .theme-light .language-select:hover {
      background: rgba(255, 255, 255, 0.8);
    }

    .glassmorphism-enhanced {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      border-radius: 20px;
      backdrop-filter: blur(3px);
      position: relative;
      z-index: 10;
    }

    /* Стили карточки для темной темы */
    .theme-dark .glassmorphism-enhanced {
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(59, 130, 246, 0.2);
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(59, 130, 246, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    /* Стили карточки для светлой темы */
    .theme-light .glassmorphism-enhanced {
      background: rgba(255, 255, 255, 0.35);
      border: 1px solid rgba(148, 163, 184, 0.3);
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(148, 163, 184, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 10px 0;
    }

    .login-subtitle {
      font-size: 1rem;
      margin: 0;
    }

    /* Стили текста для темной темы */
    .theme-dark .login-title {
      color: #f8fafc;
      text-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .theme-dark .login-subtitle {
      color: #cbd5e1;
    }

    /* Стили текста для светлой темы */
    .theme-light .login-title {
      color: #1e293b;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .theme-light .login-subtitle {
      color: #64748b;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .form-input {
      padding: 15px 20px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(3px);
    }

    .form-input:focus {
      outline: none;
      transform: translateY(-1px);
    }

    /* Стили полей для темной темы */
    .theme-dark .form-label {
      color: #f8fafc;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .theme-dark .form-input {
      background: rgba(15, 23, 42, 0.35);
      color: #f8fafc;
      border: 1px solid rgba(59, 130, 246, 0.1);
    }

    .theme-dark .form-input::placeholder {
      color: #94a3b8;
    }

    .theme-dark .form-input:focus {
      background: rgba(15, 23, 42, 0.5);
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    /* Стили полей для светлой темы */
    .theme-light .form-label {
      color: #1e293b;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .theme-light .form-input {
      background: rgba(255, 255, 255, 0.6);
      color: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .theme-light .form-input::placeholder {
      color: #64748b;
    }

    .theme-light .form-input:focus {
      background: rgba(255, 255, 255, 0.8);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border: 2px solid #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
    }

    .form-actions {
      margin-top: 10px;
    }

    .btn {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      backdrop-filter: blur(3px);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }



    .error-message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      background: rgba(255, 107, 107, 0.2);
      border: 1px solid rgba(255, 107, 107, 0.3);
      color: #ff6b6b;
      text-align: center;
      font-weight: 500;
    }

    .success-message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.3);
      color: #4caf50;
      text-align: center;
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 30px 20px;
        margin: 10px;
      }

      .login-title {
        font-size: 1.5rem;
      }

      .form-input {
        padding: 12px 16px;
      }

      .btn {
        padding: 12px;
      }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('landscapeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  currentTheme: 'light' | 'dark' = 'dark';
  currentLang: string = 'ru';

  // Three.js переменные
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  private mesh!: THREE.Points;
  private animationId: number = 0;
  private time: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userSettingsService: UserSettingsService,
    private translateService: TranslateService
  ) {
    // Получаем сохраненный язык
    this.currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    this.translateService.use(this.currentLang);
  }

  ngOnInit(): void {
    // Получаем текущую тему
    const settings = this.userSettingsService.getSettings();
    this.currentTheme = settings.ui.theme;
    
    // Инициализируем 3D ландшафт после рендера компонента
    setTimeout(() => {
      this.initThreeJS();
      this.animate();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;
    
    // Создаем сцену
    this.scene = new THREE.Scene();
    
    // Создаем камеру
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 30, 50);
    this.camera.lookAt(0, 0, 0);
    
    // Создаем рендерер
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    
    // Создаем геометрию точек
    this.createPointsGeometry();
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createPointsGeometry(): void {
    const vertices: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    
    const GRID_SIZE = 60;
    const POINT_SIZE = 2;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        // Позиции точек
        const x = (i - GRID_SIZE / 2) * 3;
        const z = (j - GRID_SIZE / 2) * 3;
        const y = 0;
        
        vertices.push(x, y, z);
        
        // Цвета в зависимости от темы
        const colorIntensity = Math.random() * 0.3 + 0.7;
        const variation = Math.random();
        
        if (this.currentTheme === 'dark') {
          if (variation < 0.6) {
            // Синий цвет для темной темы
            colors.push(
              0.2 * colorIntensity,  // R
              0.5 * colorIntensity,  // G  
              1.0 * colorIntensity   // B
            );
          } else {
            // Голубой акцент
            colors.push(
              0.4 * colorIntensity,  // R
              0.7 * colorIntensity,  // G
              0.9 * colorIntensity   // B
            );
          }
        } else {
          // Цвета для светлой темы
          if (variation < 0.6) {
            colors.push(
              0.1 * colorIntensity,  // R
              0.3 * colorIntensity,  // G
              0.8 * colorIntensity   // B
            );
          } else {
            colors.push(
              0.2 * colorIntensity,  // R
              0.4 * colorIntensity,  // G
              0.6 * colorIntensity   // B
            );
          }
        }
        
        sizes.push(POINT_SIZE);
      }
    }
    
    // Создаем геометрию
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    // Создаем материал с шейдерами
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveAmplitude: { value: 15 },
        animationSpeed: { value: 0.3 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  private getVertexShader(): string {
    return `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      uniform float waveAmplitude;
      uniform float animationSpeed;
      
      void main() {
        vColor = color;
        
        vec3 pos = position;
        
        // Создаем волнообразную анимацию
        float wave1 = sin(pos.x * 0.1 + time * animationSpeed) * 
                     sin(pos.z * 0.1 + time * animationSpeed * 0.7) * waveAmplitude;
        float wave2 = sin(pos.x * 0.05 + time * animationSpeed * 0.5) * 
                     cos(pos.z * 0.05 + time * animationSpeed * 0.3) * waveAmplitude * 0.5;
        float wave3 = cos(pos.x * 0.02 + time * animationSpeed * 0.2) * 
                     sin(pos.z * 0.02 + time * animationSpeed * 0.1) * waveAmplitude * 0.3;
        
        pos.y += wave1 + wave2 + wave3;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  private getFragmentShader(): string {
    return `
      varying vec3 vColor;
      
      void main() {
        // Создаем круглые точки с мягкими краями
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        
        gl_FragColor = vec4(vColor, alpha * 0.8);
      }
    `;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.01;
    if (this.material && this.material.uniforms) {
      this.material.uniforms['time'].value = this.time;
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  async onLogin(): Promise<void> {
    this.showError = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Пожалуйста, заполните все поля';
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.authService.login(this.email, this.password);
      
      if (result.success) {
        this.successMessage = result.message;
        // Перенаправляем сразу без задержки, чтобы избежать мелькания
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      this.errorMessage = 'Произошла ошибка при входе в систему';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    // Сохраняем в настройках пользователя
    const settings = this.userSettingsService.getSettings();
    settings.ui.theme = this.currentTheme;
    this.userSettingsService.updateSettings(settings);
    
    // Пересоздаем 3D ландшафт с новыми цветами
    if (this.scene && this.mesh) {
      this.scene.remove(this.mesh);
      this.createPointsGeometry();
    }
  }

  onLangChange(event: any): void {
    this.currentLang = event.target.value;
    localStorage.setItem('selectedLanguage', this.currentLang);
    this.translateService.use(this.currentLang);
  }

}
