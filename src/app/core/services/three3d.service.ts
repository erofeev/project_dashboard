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
  
  // === КОНФИГУРАЦИЯ И СОСТОЯНИЕ ===
  private config: Landscape3DConfig = {
    gridSize: 80,
    animationSpeed: 1.0,
    waveAmplitude: 1.5,
    particleSize: 2.0,
    colorScheme: 'wone-it',
    enableDroplets: true,
    quality: 'medium'
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
      
      // Основные волны
      float wave1 = sin(pos.x * 0.1 + uTime * uAnimationSpeed) * 
                    cos(pos.z * 0.1 + uTime * uAnimationSpeed * 0.7) * uWaveAmplitude;
      
      // Дополнительные волны для сложности
      float wave2 = sin(pos.x * 0.05 + uTime * uAnimationSpeed * 1.5) * 
                    sin(pos.z * 0.07 + uTime * uAnimationSpeed * 0.3) * uWaveAmplitude * 0.5;
      
      // Шум для органичности
      float noise = snoise(vec3(pos.x * 0.02, uTime * 0.1, pos.z * 0.02)) * uWaveAmplitude * 0.3;
      
      // Случайные колебания для "танца" точек
      float dance = sin(uTime * 2.0 + aRandomness * 10.0) * 0.2;
      
      // Применяем все эффекты к высоте
      pos.y = wave1 + wave2 + noise + dance;
      
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
    }
    
    // Пересоздаем ландшафт если изменился размер сетки
    if (newConfig.gridSize && this.landscapeGeometry) {
      this.recreateLandscape();
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
    
    // Позиционируем камеру ближе к плоскости для лучшего восприятия точек
    this.camera.position.set(0, 15, 12);
    this.camera.lookAt(0, 0, 0);
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
    
    // Создаем сетку точек
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i - size / 2) * 0.5;
        const z = (j - size / 2) * 0.5;
        const y = 0;
        
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
        uAnimationSpeed: { value: this.config.animationSpeed }
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
    const dropletCount = 100;
    
    for (let i = 0; i < dropletCount; i++) {
      dropletVertices.push(
        (Math.random() - 0.5) * 40, // x
        Math.random() * 30 + 10,     // y (высота)
        (Math.random() - 0.5) * 40   // z
      );
    }
    
    this.dropletGeometry = new THREE.BufferGeometry();
    this.dropletGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(dropletVertices, 3)
    );
    
    const dropletMaterial = new THREE.PointsMaterial({
      color: 0x4444ff,
      size: 0.5,
      transparent: true,
      opacity: 0.6
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
    
    for (let i = 1; i < array.length; i += 3) { // y координаты
      array[i] -= 0.1; // Падение
      
      // Перезапуск капли сверху
      if (array[i] < -5) {
        array[i] = Math.random() * 30 + 10;
        array[i - 1] = (Math.random() - 0.5) * 40; // новая x позиция
        array[i + 1] = (Math.random() - 0.5) * 40; // новая z позиция
      }
    }
    
    positions.needsUpdate = true;
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
