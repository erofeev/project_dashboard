import { Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
          <button class="language-toggle" (click)="toggleLanguage()" [title]="currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский'">
            {{ currentLang === 'ru' ? 'EN' : 'RU' }}
          </button>
        </div>
      </div>

      <div class="login-card glassmorphism-enhanced">
        <div class="login-header">
          <h1 class="login-title">
            {{ currentLang === 'ru' ? 'Добро пожаловать' : 'Welcome' }}
          </h1>
          <p class="login-subtitle">
            {{ currentLang === 'ru' ? 'Войдите в систему управления проектами' : 'Sign in to Project Management System' }}
          </p>
        </div>

        <form class="login-form" (ngSubmit)="onLogin()" #loginForm="ngForm" novalidate>
          <div class="form-group">
            <label for="email" class="form-label">
              {{ currentLang === 'ru' ? 'Email' : 'Email' }}
            </label>
            <div class="input-container">
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
                email
                #emailInput="ngModel"
                class="form-input"
                [placeholder]="currentLang === 'ru' ? 'Введите email' : 'Enter email'"
                [class.error]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
                autocomplete="email"
              />
              <div class="input-icon">
                <i class="pi pi-envelope"></i>
              </div>
            </div>
            <div class="field-error" *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)">
              <span *ngIf="emailInput.errors?.['required']">
                {{ currentLang === 'ru' ? 'Email обязателен' : 'Email is required' }}
              </span>
              <span *ngIf="emailInput.errors?.['email']">
                {{ currentLang === 'ru' ? 'Неверный формат email' : 'Invalid email format' }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              {{ currentLang === 'ru' ? 'Пароль' : 'Password' }}
            </label>
            <div class="input-container">
            <input
                [type]="showPassword ? 'text' : 'password'"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
                minlength="3"
                #passwordInput="ngModel"
                class="form-input"
                [placeholder]="currentLang === 'ru' ? 'Введите пароль' : 'Enter password'"
                [class.error]="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)"
                autocomplete="current-password"
              />
              <div class="input-icon password-toggle" (click)="togglePasswordVisibility()">
                <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </div>
            </div>
            <div class="field-error" *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)">
              <span *ngIf="passwordInput.errors?.['required']">
                {{ currentLang === 'ru' ? 'Пароль обязателен' : 'Password is required' }}
              </span>
              <span *ngIf="passwordInput.errors?.['minlength']">
                {{ currentLang === 'ru' ? 'Пароль должен содержать минимум 3 символа' : 'Password must be at least 3 characters' }}
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="isLoading || loginForm.invalid"
            >
              <span class="btn-content">
                <i *ngIf="isLoading" class="pi pi-spinner pi-spin mr-2"></i>
                <span *ngIf="!isLoading">{{ currentLang === 'ru' ? 'Войти' : 'Login' }}</span>
                <span *ngIf="isLoading">{{ currentLang === 'ru' ? 'Вход...' : 'Logging in...' }}</span>
              </span>
            </button>
          </div>

        </form>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message">
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

    .language-toggle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 700;
      transition: all 0.3s ease;
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
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

    .theme-dark .language-toggle {
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(34, 197, 94, 0.2);
      color: #86efac;
    }

    .theme-dark .language-toggle:hover {
      background: rgba(34, 197, 94, 0.2);
      transform: scale(1.05);
      border-color: rgba(34, 197, 94, 0.4);
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

    .theme-light .language-toggle {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #16a34a;
    }

    .theme-light .language-toggle:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: scale(1.05);
      border-color: rgba(34, 197, 94, 0.5);
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
      width: 100%;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .input-icon {
      position: absolute;
      right: 15px;
      color: #94a3b8;
      font-size: 1rem;
      pointer-events: none;
      z-index: 2;
    }

    .password-toggle {
      cursor: pointer;
      pointer-events: auto;
      transition: color 0.3s ease;
    }

    .password-toggle:hover {
      color: #3b82f6;
    }

    .field-error {
      font-size: 0.875rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .form-label {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .form-input {
      width: 100%;
      padding: 15px 45px 15px 20px; /* Увеличен правый отступ для иконки */
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(3px);
      box-sizing: border-box;
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
      width: 100%;
    }

    .btn {
      width: 100%;
      padding: 15px 20px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-sizing: border-box;
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
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .pi-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('landscapeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  currentTheme: 'light' | 'dark' = 'dark';
  currentLang: string = 'ru';
  showPassword: boolean = false;

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
  }

  ngAfterViewInit(): void {
    // Инициализируем 3D ландшафт после того, как view полностью загружен
    setTimeout(() => {
      if (this.canvasRef && this.canvasRef.nativeElement) {
        this.initThreeJS();
        this.animate();
      }
    }, 100);
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
    try {
      const canvas = this.canvasRef.nativeElement;
      if (!canvas) {
        console.warn('Canvas element not found for 3D landscape');
        return;
      }
      
      // Создаем сцену
      this.scene = new THREE.Scene();
      
      // Создаем камеру
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 30, 50);
      this.camera.lookAt(0, 0, 0);
      
      // Создаем рендерер
      this.renderer = new THREE.WebGLRenderer({ 
        canvas, 
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x000000, 0);
      
      // Создаем геометрию точек
      this.createPointsGeometry();
      
      // Обработчик изменения размера окна
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      console.log('3D landscape initialized successfully');
    } catch (error) {
      console.error('Failed to initialize 3D landscape:', error);
    }
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
    this.errorMessage = '';
    this.successMessage = '';

    // Проверяем заполненность полей
    if (!this.email?.trim() || !this.password?.trim()) {
      this.errorMessage = this.currentLang === 'ru' 
        ? 'Пожалуйста, заполните все поля' 
        : 'Please fill in all fields';
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = this.currentLang === 'ru' 
        ? 'Неверный формат email адреса' 
        : 'Invalid email address format';
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.authService.login(this.email.trim(), this.password);
      
      if (result.success) {
        this.successMessage = this.currentLang === 'ru' 
          ? 'Успешный вход в систему' 
          : 'Login successful';
        
        // Перенаправляем сразу без задержки
          this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = this.currentLang === 'ru' 
          ? 'Неверный email или пароль' 
          : 'Invalid email or password';
      }
    } catch (error) {
      this.errorMessage = this.currentLang === 'ru' 
        ? 'Произошла ошибка при входе в систему' 
        : 'An error occurred during login';
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

  toggleLanguage(): void {
    this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('selectedLanguage', this.currentLang);
    this.translateService.use(this.currentLang);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateEmail(): void {
    // Дополнительная валидация email если нужно
  }

}
