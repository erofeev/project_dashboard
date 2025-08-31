import { Injectable, ElementRef, NgZone } from '@angular/core';
import * as THREE from 'three';

export interface Landscape3DConfig {
  gridSize: number;       // Размер сетки (50x50, 100x100)
  animationSpeed: number; // Скорость анимации (0.1 - 2.0)
  waveAmplitude: number;  // Амплитуда волн (0.5 - 3.0)
  particleSize: number;   // Размер точек (1 - 5)
  colorScheme: 'wone-it' | 'blue' | 'purple' | 'gradient';
  enableDroplets: boolean; // Эффект падающих капель
  quality: 'low' | 'medium' | 'high'; // Качество для производительности
  landscapeHeight?: number; // Высота ландшафта (по умолчанию 0)
  cameraDistance?: number;  // Расстояние камеры (по умолчанию 12)
  cameraAngle?: 'top' | 'side' | 'diagonal'; // Угол обзора камеры
}

export interface PerformanceMetrics {
  fps: number;
  triangles: number;
  drawCalls: number;
  memoryUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class Three3DService {
  
  // === THREE.JS ОСНОВНЫЕ ЭЛЕМЕНТЫ ===
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  
  // === ЛАНДШАФТ И АНИМАЦИЯ ===
  private landscapeMesh: THREE.Points | null = null;
  private landscapeGeometry: THREE.BufferGeometry | null = null;
  private landscapeMaterial: THREE.ShaderMaterial | null = null;
  private dropletGeometry: THREE.BufferGeometry | null = null;
  private dropletMesh: THREE.Points | null = null;
  
  // === ВОЛНЫ ОТ ВСПЛЕСКОВ ===
  private splashWaves: Array<{
    x: number;
    z: number;
    intensity: number;
    time: number;
    maxTime: number;
  }> = [];
  
  // === ВРАЩЕНИЕ КАМЕРЫ ===
  private cameraRotationAngle: number = 0;
  private cameraRotationSpeed: number = 0.00004; // Экстремально медленное вращение (в 50 раз медленнее)
  
  // === КОНФИГУРАЦИЯ И СОСТОЯНИЕ ===
  private config: Landscape3DConfig = {
    gridSize: 100,
    animationSpeed: 0.8,
    waveAmplitude: 2.0,
    particleSize: 2.5,
    colorScheme: 'wone-it',
    enableDroplets: true,
    quality: 'high',
    landscapeHeight: 5,
    cameraDistance: 10,
    cameraAngle: 'diagonal'
  };
  
  private isInitialized: boolean = false;
  private isAnimating: boolean = false;
  private clock: THREE.Clock = new THREE.Clock();
  
  // === PERFORMANCE MONITORING ===
  private fpsCounter: number = 0;
  private lastFpsTime: number = 0;
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    triangles: 0,
    drawCalls: 0,
    memoryUsage: 0
  };
  
  // === ШЕЙДЕРЫ ===
  private vertexShader = `
    uniform float uTime;
    uniform float uWaveAmplitude;
    uniform float uAnimationSpeed;
    uniform float uLandscapeHeight;
    uniform float uSplashWaves[50]; // Массив волн от всплесков [x, z, intensity, time, maxTime] * 10 волн
    uniform int uSplashWaveCount;
    attribute float aRandomness;
    attribute float aScale;
    varying vec3 vColor;
    varying float vAlpha;
    
    // Simplex noise функция
    vec4 permute(vec4 x) {
      return mod(((x*34.0)+1.0)*x, 289.0);
    }
    
    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;
      
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 1.0 / 7.0;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
      vec3 pos = position;
      
      // Основные волны (замедлено в 5 раз)
      float wave1 = sin(pos.x * 0.1 + uTime * uAnimationSpeed * 0.2) * 
                    cos(pos.z * 0.1 + uTime * uAnimationSpeed * 0.14) * uWaveAmplitude;
      
      // Дополнительные волны для сложности (замедлено в 5 раз)
      float wave2 = sin(pos.x * 0.05 + uTime * uAnimationSpeed * 0.3) * 
                    sin(pos.z * 0.07 + uTime * uAnimationSpeed * 0.06) * uWaveAmplitude * 0.5;
      
      // Шум для органичности (замедлено в 5 раз)
      float noise = snoise(vec3(pos.x * 0.02, uTime * 0.02, pos.z * 0.02)) * uWaveAmplitude * 0.3;
      
      // Случайные колебания для "танца" точек (замедлено в 5 раз)
      float dance = sin(uTime * 0.4 + aRandomness * 10.0) * 0.2;
      
      // Эффект волн от всплесков дождя
      float splashEffect = 0.0;
      for (int i = 0; i < uSplashWaveCount; i++) {
        int idx = i * 5;
        float waveX = uSplashWaves[idx];
        float waveZ = uSplashWaves[idx + 1];
        float intensity = uSplashWaves[idx + 2];
        float time = uSplashWaves[idx + 3];
        float maxTime = uSplashWaves[idx + 4];
        
        // Расстояние от точки до центра волны
        float distance = length(vec2(pos.x - waveX, pos.z - waveZ));
        
        // Радиус волны увеличивается со временем (замедлено в 40 раз)
        float waveRadius = time * 0.15375;
        
        // Если точка в радиусе волны (увеличена ширина для заметности)
        if (distance < waveRadius && distance > waveRadius - 4.0) {
          // Интенсивность волны уменьшается со временем
          float waveIntensity = intensity * (1.0 - time / maxTime);
          // Создаем кольцевую волну (увеличена интенсивность для заметности)
          float wave = sin((distance - waveRadius + 4.0) * 1.5708) * waveIntensity * 1.2;
          splashEffect += wave;
        }
      }
      
      // Применяем все эффекты к высоте с учетом базовой высоты ландшафта
      pos.y = uLandscapeHeight + wave1 + wave2 + noise + dance + splashEffect;
      
      // Масштабирование частиц в зависимости от высоты
      float heightFactor = (pos.y + uWaveAmplitude) / (uWaveAmplitude * 2.0);
      gl_PointSize = aScale * (1.0 + heightFactor * 0.5);
      
      // Цвет на основе высоты (Wone IT градиент)
      float colorFactor = heightFactor;
      vColor = mix(
        vec3(0.2, 0.4, 1.0), // Синий
        vec3(0.6, 0.2, 1.0), // Фиолетовый
        colorFactor
      );
      
      // Альфа канал для прозрачности
      vAlpha = 0.6 + heightFactor * 0.4;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  
  private fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Создаем круглые точки
      vec2 coords = gl_PointCoord - vec2(0.5);
      float distance = length(coords);
      
      if (distance > 0.5) {
        discard;
      }
      
      // Мягкие края
      float alpha = vAlpha * (1.0 - distance * 2.0);
      
      // Добавляем свечение в центре
      float glow = 1.0 - distance * 1.5;
      vec3 finalColor = vColor + vec3(glow * 0.3);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  constructor(private ngZone: NgZone) {}

  /**
   * Инициализация 3D сцены
   */
  public async initialize(
    container: ElementRef<HTMLElement>, 
    config: Partial<Landscape3DConfig> = {}
  ): Promise<boolean> {
    try {
      // Объединяем конфигурации
      this.config = { ...this.config, ...config };
      
      // Проверяем поддержку WebGL
      if (!this.isWebGLSupported()) {
        console.warn('WebGL не поддерживается, 3D ландшафт отключен');
        return false;
      }
      
      // Адаптируем качество под устройство
      this.adaptConfigForDevice();
      
      // Создаем основные компоненты Three.js
      this.createScene();
      this.createCamera(container);
      this.createRenderer(container);
      
      // Создаем 3D ландшафт
      this.createLandscape();
      
      if (this.config.enableDroplets) {
        this.createDroplets();
      }
      
      // Добавляем освещение
      this.addLighting();
      
      // Настраиваем адаптивность
      this.setupResponsive(container);
      
      this.isInitialized = true;
      console.log('🌄 3D ландшафт инициализирован успешно');
      
      return true;
      
    } catch (error) {
      console.error('❌ Ошибка инициализации 3D ландшафта:', error);
      return false;
    }
  }

  /**
   * Запуск анимации
   */
  public startAnimation(): void {
    if (!this.isInitialized || this.isAnimating) {
      return;
    }
    
    this.isAnimating = true;
    this.clock.start();
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
    
    console.log('▶️ 3D анимация запущена');
  }

  /**
   * Остановка анимации
   */
  public stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.isAnimating = false;
    console.log('⏸️ 3D анимация остановлена');
  }

  /**
   * Изменение конфигурации в реальном времени
   */
  public updateConfig(newConfig: Partial<Landscape3DConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Обновляем материал ландшафта
    if (this.landscapeMaterial) {
      this.landscapeMaterial.uniforms['uAnimationSpeed'].value = this.config.animationSpeed;
      this.landscapeMaterial.uniforms['uWaveAmplitude'].value = this.config.waveAmplitude;
      this.landscapeMaterial.uniforms['uLandscapeHeight'].value = this.config.landscapeHeight || 0;
    }
    
    // Пересоздаем ландшафт если изменился размер сетки
    if (newConfig.gridSize && this.landscapeGeometry) {
      this.recreateLandscape();
    }
    
    // Пересоздаем камеру если изменился угол обзора
    if (newConfig.cameraAngle && this.camera) {
      this.recreateCamera();
    }
    
    console.log('🔄 Конфигурация 3D ландшафта обновлена');
  }

  /**
   * Получение метрик производительности
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Очистка ресурсов
   */
  public dispose(): void {
    this.stopAnimation();
    
    // Очищаем геометрии
    if (this.landscapeGeometry) {
      this.landscapeGeometry.dispose();
    }
    
    if (this.dropletGeometry) {
      this.dropletGeometry.dispose();
    }
    
    // Очищаем материалы
    if (this.landscapeMaterial) {
      this.landscapeMaterial.dispose();
    }
    
    // Очищаем рендерер
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    console.log('🧹 3D ресурсы очищены');
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===

  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  private adaptConfigForDevice(): void {
    // Определяем возможности устройства
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB
    
    if (isMobile || deviceMemory < 4) {
      this.config.quality = 'low';
      this.config.gridSize = Math.min(this.config.gridSize, 50);
      this.config.enableDroplets = false;
    } else if (deviceMemory >= 8) {
      this.config.quality = 'high';
    }
    
    console.log(`📱 Адаптация под устройство: ${this.config.quality} качество, сетка ${this.config.gridSize}x${this.config.gridSize}`);
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = null; // Прозрачный фон
    this.scene.fog = new THREE.Fog(0x000000, 10, 100);
  }

  private createCamera(container: ElementRef<HTMLElement>): void {
    const aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    
    // Позиционируем камеру в зависимости от выбранного угла
    const distance = this.config.cameraDistance || 12;
    const height = this.config.landscapeHeight || 0;
    const angle = this.config.cameraAngle || 'diagonal';
    
    switch (angle) {
      case 'top':
        // Вид сверху (более динамичный)
        this.camera.position.set(0, distance * 1.8, 0);
        this.camera.lookAt(0, height + 1, 0);
        break;
        
      case 'side':
        // Вид сбоку (более красивый угол)
        this.camera.position.set(distance * 1.2, distance * 0.8, distance * 0.3);
        this.camera.lookAt(0, height + 1, 0);
        break;
        
      case 'diagonal':
      default:
        // Диагональный вид (красивый динамичный угол)
        this.camera.position.set(distance * 0.7, distance * 1.4, distance * 0.8);
        this.camera.lookAt(0, height + 2, 0);
        break;
    }
  }

  private createRenderer(container: ElementRef<HTMLElement>): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: this.config.quality !== 'low',
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(
      container.nativeElement.clientWidth,
      container.nativeElement.clientHeight
    );
    
    this.renderer.setPixelRatio(
      this.config.quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1
    );
    
    container.nativeElement.appendChild(this.renderer.domElement);
  }

  private createLandscape(): void {
    const size = this.config.gridSize;
    const vertices = [];
    const randomness = [];
    const scales = [];
    const landscapeHeight = this.config.landscapeHeight || 0;
    
    // Создаем сетку точек
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i - size / 2) * 0.5;
        const z = (j - size / 2) * 0.5;
        const y = landscapeHeight; // Используем новую высоту
        
        vertices.push(x, y, z);
        randomness.push(Math.random());
        scales.push(this.config.particleSize + Math.random() * 2);
      }
    }
    
    // Создаем геометрию
    this.landscapeGeometry = new THREE.BufferGeometry();
    this.landscapeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.landscapeGeometry.setAttribute(
      'aRandomness',
      new THREE.Float32BufferAttribute(randomness, 1)
    );
    this.landscapeGeometry.setAttribute(
      'aScale',
      new THREE.Float32BufferAttribute(scales, 1)
    );
    
    // Создаем материал с шейдерами
    this.landscapeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaveAmplitude: { value: this.config.waveAmplitude },
        uAnimationSpeed: { value: this.config.animationSpeed },
        uLandscapeHeight: { value: landscapeHeight },
        uSplashWaves: { value: new Array(50).fill(0) },
        uSplashWaveCount: { value: 0 }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Создаем mesh
    this.landscapeMesh = new THREE.Points(this.landscapeGeometry, this.landscapeMaterial);
    this.scene!.add(this.landscapeMesh);
  }

  private createDroplets(): void {
    const dropletVertices = [];
    const dropletCount = 150; // Больше капель для лучшего эффекта
    
    for (let i = 0; i < dropletCount; i++) {
      dropletVertices.push(
        (Math.random() - 0.5) * 100, // x - широкая область над плоскостью
        Math.random() * 30 + 15,     // y (высота) - над плоскостью ландшафта
        (Math.random() - 0.5) * 100   // z - глубокая область над плоскостью
      );
    }
    
    this.dropletGeometry = new THREE.BufferGeometry();
    this.dropletGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(dropletVertices, 3)
    );
    
    // Создаем круглую текстуру для капель
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d')!;
    
    // Создаем градиент для круглой капли
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(80, 120, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(60, 100, 255, 0.2)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(16, 16, 16, 0, Math.PI * 2);
    context.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const dropletMaterial = new THREE.PointsMaterial({
      map: texture, // Используем круглую текстуру
      color: 0x88aaff,
      size: 0.6, // Меньше для фонового эффекта
      transparent: true,
      opacity: 0.5, // Более прозрачные для фонового эффекта
      alphaTest: 0.1, // Убираем квадратные края
      blending: THREE.AdditiveBlending // Красивый эффект свечения
    });
    
    this.dropletMesh = new THREE.Points(this.dropletGeometry, dropletMaterial);
    this.scene!.add(this.dropletMesh);
  }

  private addLighting(): void {
    // Ambient light для общего освещения
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene!.add(ambientLight);
    
    // Directional light для объёма
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene!.add(directionalLight);
  }

  private setupResponsive(container: ElementRef<HTMLElement>): void {
    const handleResize = () => {
      if (!this.camera || !this.renderer) return;
      
      const width = container.nativeElement.clientWidth;
      const height = container.nativeElement.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
  }

  private recreateLandscape(): void {
    if (this.landscapeMesh && this.scene) {
      this.scene.remove(this.landscapeMesh);
    }
    
    if (this.landscapeGeometry) {
      this.landscapeGeometry.dispose();
    }
    
    this.createLandscape();
  }

  private recreateCamera(): void {
    if (this.camera) {
      // Обновляем позицию камеры с новым углом
      const distance = this.config.cameraDistance || 12;
      const height = this.config.landscapeHeight || 0;
      const angle = this.config.cameraAngle || 'diagonal';
      
      switch (angle) {
        case 'top':
          this.camera.position.set(0, distance * 1.8, 0);
          this.camera.lookAt(0, height + 1, 0);
          break;
          
        case 'side':
          this.camera.position.set(distance * 1.2, distance * 0.8, distance * 0.3);
          this.camera.lookAt(0, height + 1, 0);
          break;
          
        case 'diagonal':
        default:
          this.camera.position.set(distance * 0.7, distance * 1.4, distance * 0.8);
          this.camera.lookAt(0, height + 2, 0);
          break;
      }
    }
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const elapsed = this.clock.getElapsedTime();
    
    // Обновляем шейдеры
    if (this.landscapeMaterial) {
      this.landscapeMaterial.uniforms['uTime'].value = elapsed;
    }
    
    // Анимация капель
    if (this.dropletMesh && this.config.enableDroplets) {
      this.animateDroplets(elapsed);
    }
    
    // Обновление волн от всплесков
    this.updateSplashWaves(elapsed);
    
    // Обновление вращения камеры
    this.updateCameraRotation(elapsed);
    
    // Рендерим сцену
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    // Обновляем метрики производительности
    this.updatePerformanceMetrics();
  }

  private animateDroplets(elapsed: number): void {
    if (!this.dropletGeometry) return;
    
    const positions = this.dropletGeometry.attributes['position'];
    const array = positions.array as Float32Array;
    const speed = (0.2 * this.config.animationSpeed) / 13; // Замедлено в 13 раз (1.3 * 10)
    const landscapeHeight = this.config.landscapeHeight || 0;
    
    for (let i = 1; i < array.length; i += 3) { // y координаты
      // Более реалистичное падение с небольшой случайностью
      array[i] -= speed + (Math.random() - 0.5) * 0.03;
      
      // Небольшое горизонтальное движение для реалистичности
      array[i - 1] += (Math.random() - 0.5) * 0.015; // x координата
      array[i + 1] += (Math.random() - 0.5) * 0.015; // z координата
      
      // Когда капля достигает плоскости ландшафта - создаем всплеск
      if (array[i] <= landscapeHeight + 1) {
        // Создаем эффект всплеска (увеличиваем размер капли)
        const splashIntensity = Math.random() * 0.5 + 0.5;
        
        // Перезапуск капли сверху с улучшенным позиционированием
        array[i] = Math.random() * 30 + 15; // Выше стартовая позиция
        array[i - 1] = (Math.random() - 0.5) * 100; // новая x позиция (шире)
        array[i + 1] = (Math.random() - 0.5) * 100; // новая z позиция (глубже)
        
        // Здесь можно добавить эффект волн на ландшафте
        this.createSplashWave(array[i - 1], array[i + 1], splashIntensity);
      }
    }
    
    positions.needsUpdate = true;
  }

  private createSplashWave(x: number, z: number, intensity: number): void {
    // Добавляем новую волну от всплеска
    this.splashWaves.push({
      x: x,
      z: z,
      intensity: intensity,
      time: 0,
      maxTime: 15.0 + Math.random() * 10.0 // Длительность волны 15-25 секунд (для медленных волн)
    });
    
    // Ограничиваем количество активных волн для производительности
    if (this.splashWaves.length > 50) {
      this.splashWaves.shift();
    }
  }

  private updateSplashWaves(elapsed: number): void {
    // Обновляем все активные волны
    for (let i = this.splashWaves.length - 1; i >= 0; i--) {
      const wave = this.splashWaves[i];
      wave.time += elapsed;
      
      // Удаляем завершенные волны
      if (wave.time >= wave.maxTime) {
        this.splashWaves.splice(i, 1);
      }
    }
    
    // Обновляем данные волн в шейдере
    if (this.landscapeMaterial) {
      const waveArray = new Array(50).fill(0);
      const waveCount = Math.min(this.splashWaves.length, 10); // Максимум 10 волн
      
      for (let i = 0; i < waveCount; i++) {
        const wave = this.splashWaves[i];
        const idx = i * 5;
        waveArray[idx] = wave.x;
        waveArray[idx + 1] = wave.z;
        waveArray[idx + 2] = wave.intensity;
        waveArray[idx + 3] = wave.time;
        waveArray[idx + 4] = wave.maxTime;
      }
      
      this.landscapeMaterial.uniforms['uSplashWaves'].value = waveArray;
      this.landscapeMaterial.uniforms['uSplashWaveCount'].value = waveCount;
    }
  }

  private updateCameraRotation(elapsed: number): void {
    if (!this.camera) return;
    
    // Обновляем угол вращения
    this.cameraRotationAngle += this.cameraRotationSpeed * elapsed;
    
    // Получаем текущие параметры камеры
    const distance = this.config.cameraDistance || 10;
    const height = this.config.landscapeHeight || 5;
    const angle = this.config.cameraAngle || 'diagonal';
    
    // Вычисляем новую позицию камеры с вращением
    let baseX = 0, baseY = 0, baseZ = 0;
    
    switch (angle) {
      case 'top':
        baseX = 0;
        baseY = distance * 1.8;
        baseZ = 0;
        break;
      case 'side':
        baseX = distance * 1.2;
        baseY = distance * 0.8;
        baseZ = distance * 0.3;
        break;
      case 'diagonal':
      default:
        baseX = distance * 0.7;
        baseY = distance * 1.4;
        baseZ = distance * 0.8;
        break;
    }
    
    // Применяем вращение вокруг Y оси (вертикальной)
    const rotatedX = baseX * Math.cos(this.cameraRotationAngle) - baseZ * Math.sin(this.cameraRotationAngle);
    const rotatedZ = baseX * Math.sin(this.cameraRotationAngle) + baseZ * Math.cos(this.cameraRotationAngle);
    
    // Обновляем позицию камеры
    this.camera.position.set(rotatedX, baseY, rotatedZ);
    this.camera.lookAt(0, height + 2, 0);
  }

  private updatePerformanceMetrics(): void {
    const now = performance.now();
    this.fpsCounter++;
    
    if (now >= this.lastFpsTime + 1000) {
      this.performanceMetrics.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.lastFpsTime = now;
    }
    
    if (this.renderer) {
      const info = this.renderer.info;
      this.performanceMetrics.triangles = info.render.triangles;
      this.performanceMetrics.drawCalls = info.render.calls;
      this.performanceMetrics.memoryUsage = info.memory.geometries + info.memory.textures;
    }
  }
}
