import { 
  Component, 
  OnInit, 
  OnDestroy, 
  AfterViewInit, 
  ElementRef, 
  ViewChild, 
  Input,
  Output,
  EventEmitter,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Three3DService, Landscape3DConfig, PerformanceMetrics } from '../../../core/services/three3d.service';

@Component({
  selector: 'app-animated-landscape',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 3D Canvas Container -->
    <div 
      #landscapeContainer 
      class="landscape-container"
      [class.landscape-loading]="isLoading()"
      [class.landscape-error]="hasError()"
    >
      <!-- Loading Indicator -->
      @if (isLoading()) {
        <div class="landscape-loading-overlay">
          <div class="loading-spinner"></div>
          <p>Инициализация 3D ландшафта...</p>
        </div>
      }
      
      <!-- Error Message -->
      @if (hasError()) {
        <div class="landscape-error-overlay">
          <div class="error-icon">⚠️</div>
          <p>3D ландшафт недоступен</p>
          <small>WebGL не поддерживается вашим браузером</small>
        </div>
      }
      
      <!-- Performance Monitor (Development) -->
      @if (showPerformanceMonitor && !isLoading() && !hasError()) {
        <div class="performance-monitor">
          <div class="perf-item">
            <span>FPS:</span>
            <span [class.perf-warning]="performanceMetrics().fps < 30">
              {{ performanceMetrics().fps }}
            </span>
          </div>
          <div class="perf-item">
            <span>Triangles:</span>
            <span>{{ formatNumber(performanceMetrics().triangles) }}</span>
          </div>
          <div class="perf-item">
            <span>Draw Calls:</span>
            <span>{{ performanceMetrics().drawCalls }}</span>
          </div>
        </div>
      }
      
      <!-- Controls Panel -->
      @if (showControls && !isLoading() && !hasError()) {
        <div class="landscape-controls">
          <button 
            class="control-btn"
            (click)="toggleAnimation()"
            [attr.aria-label]="isAnimating() ? 'Остановить анимацию' : 'Запустить анимацию'"
          >
            {{ isAnimating() ? '⏸️' : '▶️' }}
          </button>
          
          <button 
            class="control-btn"
            (click)="toggleDroplets()"
            [attr.aria-label]="'Переключить эффект капель'"
          >
            💧
          </button>
          
          <div class="control-group">
            <label>Скорость:</label>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1"
              [value]="config.animationSpeed"
              (input)="updateAnimationSpeed($event)"
              class="control-slider"
            >
          </div>
          
          <div class="control-group">
            <label>Амплитуда:</label>
            <input 
              type="range" 
              min="0.5" 
              max="4" 
              step="0.1"
              [value]="config.waveAmplitude"
              (input)="updateWaveAmplitude($event)"
              class="control-slider"
            >
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./animated-landscape.component.scss']
})
export class AnimatedLandscapeComponent implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild('landscapeContainer', { static: true }) 
  containerRef!: ElementRef<HTMLElement>;
  
  // === INPUT PROPERTIES ===
  @Input() config: Landscape3DConfig = {
    gridSize: 80,
    animationSpeed: 1.2,
    waveAmplitude: 1.8,
    particleSize: 2.5,
    colorScheme: 'wone-it',
    enableDroplets: true,
    quality: 'medium'
  };
  
  @Input() autoStart: boolean = true;
  @Input() showControls: boolean = false;
  @Input() showPerformanceMonitor: boolean = false;
  @Input() enableUserInteraction: boolean = true;
  
  // === OUTPUT EVENTS ===
  @Output() initialized = new EventEmitter<boolean>();
  @Output() animationStateChanged = new EventEmitter<boolean>();
  @Output() performanceUpdate = new EventEmitter<PerformanceMetrics>();
  @Output() configChanged = new EventEmitter<Landscape3DConfig>();
  
  // === REACTIVE STATE ===
  public readonly isLoading = signal<boolean>(true);
  public readonly hasError = signal<boolean>(false);
  public readonly isAnimating = signal<boolean>(false);
  public readonly performanceMetrics = signal<PerformanceMetrics>({
    fps: 0,
    triangles: 0,
    drawCalls: 0,
    memoryUsage: 0
  });
  
  // === SERVICES ===
  private readonly three3DService = inject(Three3DService);
  
  // === PRIVATE STATE ===
  private performanceTimer: number | null = null;
  private isComponentDestroyed = false;
  
  async ngOnInit(): Promise<void> {
    console.log('🌄 Инициализация компонента анимированного ландшафта');
    
    // Адаптируем конфигурацию под предпочтения пользователя
    this.adaptConfigForAccessibility();
  }
  
  async ngAfterViewInit(): Promise<void> {
    // Небольшая задержка для корректной инициализации DOM
    setTimeout(() => {
      this.initializeLandscape();
    }, 100);
  }
  
  ngOnDestroy(): void {
    this.isComponentDestroyed = true;
    
    // Очищаем таймеры
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
    }
    
    // Останавливаем анимацию и очищаем ресурсы
    this.three3DService.stopAnimation();
    this.three3DService.dispose();
    
    console.log('🧹 Компонент ландшафта очищен');
  }
  
  // === PUBLIC METHODS ===
  
  public async reinitialize(newConfig?: Partial<Landscape3DConfig>): Promise<void> {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
    
    this.isLoading.set(true);
    this.hasError.set(false);
    
    this.three3DService.stopAnimation();
    this.three3DService.dispose();
    
    await this.initializeLandscape();
  }
  
  public toggleAnimation(): void {
    if (this.isAnimating()) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }
  
  public startAnimation(): void {
    if (this.hasError()) return;
    
    this.three3DService.startAnimation();
    this.isAnimating.set(true);
    this.animationStateChanged.emit(true);
    
    this.startPerformanceMonitoring();
  }
  
  public stopAnimation(): void {
    this.three3DService.stopAnimation();
    this.isAnimating.set(false);
    this.animationStateChanged.emit(false);
    
    this.stopPerformanceMonitoring();
  }
  
  public toggleDroplets(): void {
    const newConfig = {
      ...this.config,
      enableDroplets: !this.config.enableDroplets
    };
    
    this.updateConfiguration(newConfig);
  }
  
  public updateAnimationSpeed(event: Event): void {
    const target = event.target as HTMLInputElement;
    const speed = parseFloat(target.value);
    
    this.updateConfiguration({
      ...this.config,
      animationSpeed: speed
    });
  }
  
  public updateWaveAmplitude(event: Event): void {
    const target = event.target as HTMLInputElement;
    const amplitude = parseFloat(target.value);
    
    this.updateConfiguration({
      ...this.config,
      waveAmplitude: amplitude
    });
  }
  
  public formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  // === PRIVATE METHODS ===
  
  private async initializeLandscape(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.hasError.set(false);
      
      console.log('🔄 Инициализация 3D ландшафта с конфигурацией:', this.config);
      
      const success = await this.three3DService.initialize(
        this.containerRef, 
        this.config
      );
      
      if (success) {
        this.initialized.emit(true);
        
        if (this.autoStart) {
          this.startAnimation();
        }
        
        console.log('✅ 3D ландшафт успешно инициализирован');
      } else {
        throw new Error('Не удалось инициализировать 3D ландшафт');
      }
      
    } catch (error) {
      console.error('❌ Ошибка инициализации 3D ландшафта:', error);
      this.hasError.set(true);
      this.initialized.emit(false);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private updateConfiguration(newConfig: Landscape3DConfig): void {
    this.config = newConfig;
    this.three3DService.updateConfig(newConfig);
    this.configChanged.emit(newConfig);
  }
  
  private adaptConfigForAccessibility(): void {
    // Проверяем предпочтения пользователя по анимации
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      this.config.animationSpeed *= 0.5; // Замедляем анимацию
      this.config.enableDroplets = false; // Отключаем дополнительные эффекты
      this.autoStart = false; // Не запускаем автоматически
      
      console.log('♿ Адаптация для пользователей с ограниченной подвижностью');
    }
  }
  
  private startPerformanceMonitoring(): void {
    if (this.performanceTimer || !this.showPerformanceMonitor) {
      return;
    }
    
    this.performanceTimer = window.setInterval(() => {
      if (this.isComponentDestroyed) {
        this.stopPerformanceMonitoring();
        return;
      }
      
      const metrics = this.three3DService.getPerformanceMetrics();
      this.performanceMetrics.set(metrics);
      this.performanceUpdate.emit(metrics);
      
      // Автоматическое снижение качества при низком FPS
      if (metrics.fps < 20 && this.config.quality !== 'low') {
        console.warn('⚠️ Низкий FPS, снижение качества');
        this.updateConfiguration({
          ...this.config,
          quality: 'low',
          gridSize: Math.min(this.config.gridSize, 50),
          enableDroplets: false
        });
      }
      
    }, 1000);
  }
  
  private stopPerformanceMonitoring(): void {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
  }
}
