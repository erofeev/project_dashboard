import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import { LandscapeControlService } from '../../services/landscape-control.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-3d-landscape',
  template: `
    <div #container class="landscape-container"></div>
  `,
  styles: [`
    .landscape-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
    }
  `],
  standalone: true
})
export class Landscape3dComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  private mesh!: THREE.Points;
  private animationId: number = 0;
  private time: number = 0;
  private settingsSubscription!: Subscription;
  private themeSubscription!: Subscription;
  private currentTheme: 'light' | 'dark' = 'light';

  // Параметры сетки
  private GRID_SIZE = 100;
  private readonly POINT_SIZE = 2;
  private readonly ANIMATION_SPEED = 0.3; // Сделали медленнее
  private readonly WAVE_AMPLITUDE = 15;

  constructor(
    private landscapeService: LandscapeControlService,
    private userSettingsService: UserSettingsService
  ) {}

  ngOnInit(): void {
    this.initThreeJS();
    this.animate();
    
    // Подписываемся на изменения настроек в реальном времени
    this.settingsSubscription = this.landscapeService.settings$.subscribe(settings => {
      this.applySettings(settings);
    });

    // Подписываемся на изменения темы
    this.themeSubscription = this.userSettingsService.settings$.subscribe(settings => {
      if (settings.ui.theme !== this.currentTheme) {
        this.currentTheme = settings.ui.theme;
        this.updateTheme();
      }
    });

    // Инициализируем текущую тему
    const userSettings = this.userSettingsService.getSettings();
    this.currentTheme = userSettings.ui.theme;
    this.updateTheme();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  private initThreeJS(): void {
    // Создаем сцену
    this.scene = new THREE.Scene();
    
    // Настраиваем фон в зависимости от темы
    if (this.currentTheme === 'dark') {
      this.scene.fog = new THREE.Fog(0x000000, 100, 200); // Черный фон для темной темы
    } else {
      this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 200); // Светлый фон для светлой темы
    }

    // Создаем камеру
    this.camera = new THREE.PerspectiveCamera(
      60, // Уменьшили угол обзора для лучшего восприятия глубины
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 80, 200); // Отодвинули дальше и подняли выше
    this.camera.lookAt(0, 0, 0);

    // Создаем рендерер
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.containerRef.nativeElement.appendChild(this.renderer.domElement);

    // Создаем геометрию сетки
    this.createGridGeometry();

    // Добавляем освещение
    this.addLighting();
  }

  private createGridGeometry(): void {
    const vertices: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Создаем регулярную сетку точек
    for (let x = 0; x < this.GRID_SIZE; x++) {
      for (let z = 0; z < this.GRID_SIZE; z++) {
        const xPos = (x - this.GRID_SIZE / 2) * 4; // Увеличили размер сетки
        const zPos = (z - this.GRID_SIZE / 2) * 4; // Увеличили размер сетки
        const yPos = 0;

        vertices.push(xPos, yPos, zPos);

        // Цвета в стиле Wone IT (фиолетово-красные оттенки как на баннере)
        const colorIntensity = Math.random() * 0.3 + 0.7;
        const variation = Math.random();
        
        // Адаптируем интенсивность цветов в зависимости от темы
        const themeMultiplier = this.currentTheme === 'dark' ? 1.2 : 1.0;
        
        if (variation < 0.6) {
          // Основной фиолетовый цвет (как на баннере)
          colors.push(
            Math.min(1.0, 0.6 * colorIntensity * themeMultiplier),  // R - фиолетовый
            Math.min(1.0, 0.2 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.8 * colorIntensity * themeMultiplier)   // B
          );
        } else if (variation < 0.8) {
          // Красный акцент (как кнопка на баннере)
          colors.push(
            Math.min(1.0, 0.9 * colorIntensity * themeMultiplier),  // R - красный
            Math.min(1.0, 0.2 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.3 * colorIntensity * themeMultiplier)   // B
          );
        } else {
          // Светло-голубой (как элементы на экране ноутбука)
          colors.push(
            Math.min(1.0, 0.4 * colorIntensity * themeMultiplier),  // R
            Math.min(1.0, 0.7 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.9 * colorIntensity * themeMultiplier)   // B
          );
        }

        // Размеры точек
        sizes.push(this.POINT_SIZE);
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
        waveAmplitude: { value: this.WAVE_AMPLITUDE },
        animationSpeed: { value: this.ANIMATION_SPEED }
      },
      vertexShader: `
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
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Создаем круглые точки с мягкими краями
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // Создаем меш из точек
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  private addLighting(): void {
    // Основное освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Направленное освещение
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Точечное освещение для динамики
    const pointLight = new THREE.PointLight(0x3b82f6, 1, 200);
    pointLight.position.set(0, 50, 0);
    this.scene.add(pointLight);
  }

  private animate(): void {
    this.time += 0.016; // ~60fps

    // Обновляем uniform время для шейдера
    if (this.material) {
      (this.material.uniforms as any).time.value = this.time;
    }

    // Вращаем камеру для динамики (медленнее и плавнее)
    if (this.camera) {
      this.camera.position.x = Math.sin(this.time * 0.05) * 150; // Медленнее и дальше
      this.camera.position.z = Math.cos(this.time * 0.05) * 150; // Медленнее и дальше
      this.camera.lookAt(0, 0, 0);
    }

    // Рендерим сцену
    this.renderer.render(this.scene, this.camera);

    // Продолжаем анимацию
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  // Публичные методы для настройки параметров
  setWaveAmplitude(amplitude: number): void {
    if (this.material) {
      (this.material.uniforms as any).waveAmplitude.value = amplitude;
    }
  }

  setAnimationSpeed(speed: number): void {
    if (this.material) {
      (this.material.uniforms as any).animationSpeed.value = speed;
    }
  }

  setPointSize(size: number): void {
    if (this.geometry) {
      const sizeAttribute = this.geometry.getAttribute('size');
      for (let i = 0; i < sizeAttribute.count; i++) {
        sizeAttribute.setX(i, size);
      }
      sizeAttribute.needsUpdate = true;
    }
  }

  // Применяем настройки в реальном времени
  private applySettings(settings: any): void {
    if (this.material) {
      // Обновляем uniforms для шейдера
      (this.material.uniforms as any).waveAmplitude.value = settings.waveAmplitude || this.WAVE_AMPLITUDE;
      (this.material.uniforms as any).animationSpeed.value = settings.animationSpeed || this.ANIMATION_SPEED;
    }
    
    // Обновляем размер точек
    if (settings.pointSize && this.geometry) {
      this.setPointSize(settings.pointSize);
    }
    
    // Обновляем размер сетки (пересоздаем геометрию)
    if (settings.gridSize && settings.gridSize !== this.GRID_SIZE) {
      this.updateGridSize(settings.gridSize);
    }
    
    // Обновляем цветовую схему
    if (settings.colorScheme) {
      this.updateColorScheme(settings.colorScheme);
    }
  }

  // Обновляем размер сетки
  private updateGridSize(newSize: number): void {
    // Очищаем старую геометрию и меш
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(mat => mat.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    // Обновляем размер сетки
    this.GRID_SIZE = newSize;
    
    // Пересоздаем геометрию с новым размером
    this.createGridGeometry();
    
    // Создаем новый меш
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  // Обновляем цветовую схему
  private updateColorScheme(scheme: string): void {
    if (!this.geometry) return;
    
    // Очищаем старую геометрию и меш
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(mat => mat.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    
    const colors: number[] = [];
    
    for (let i = 0; i < this.GRID_SIZE * this.GRID_SIZE; i++) {
      const colorIntensity = Math.random() * 0.3 + 0.7;
      const variation = Math.random();
      
      // Адаптируем интенсивность цветов в зависимости от темы
      const themeMultiplier = this.currentTheme === 'dark' ? 1.2 : 1.0;
      
      if (scheme === 'wone-it') {
        // Стиль Wone IT с фиолетово-красными тонами как на баннере
        if (variation < 0.6) {
          // Основной фиолетовый цвет (как на баннере)
          colors.push(
            Math.min(1.0, 0.6 * colorIntensity * themeMultiplier),  // R - фиолетовый
            Math.min(1.0, 0.2 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.8 * colorIntensity * themeMultiplier)   // B
          );
        } else if (variation < 0.8) {
          // Красный акцент (как кнопка на баннере)
          colors.push(
            Math.min(1.0, 0.9 * colorIntensity * themeMultiplier),  // R - красный
            Math.min(1.0, 0.2 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.3 * colorIntensity * themeMultiplier)   // B
          );
        } else {
          // Светло-голубой (как элементы на экране ноутбука)
          colors.push(
            Math.min(1.0, 0.4 * colorIntensity * themeMultiplier),  // R
            Math.min(1.0, 0.7 * colorIntensity * themeMultiplier),  // G
            Math.min(1.0, 0.9 * colorIntensity * themeMultiplier)   // B
          );
        }
      } else {
        // Другие цветовые схемы
        const colorMap = {
          'sunset': { r: 1.0, g: 0.4, b: 0.2 },
          'ocean': { r: 0.1, g: 0.6, b: 0.8 },
          'forest': { r: 0.2, g: 0.7, b: 0.3 }
        };
        
        const colorScheme = colorMap[scheme as keyof typeof colorMap] || colorMap['sunset'];
        colors.push(
          Math.min(1.0, colorScheme.r * colorIntensity * themeMultiplier),
          Math.min(1.0, colorScheme.g * colorIntensity * themeMultiplier),
          Math.min(1.0, colorScheme.b * colorIntensity * themeMultiplier)
        );
      }
    }
    
    // Обновляем цвета в геометрии
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Создаем новый меш с обновленной геометрией
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  private updateTheme(): void {
    if (this.currentTheme === 'dark') {
      // Темная тема - черный фон
      this.scene.fog = new THREE.Fog(0x000000, 100, 200);
      this.renderer.setClearColor(0x000000, 0);
      
      // Также обновляем освещение для темной темы
      if (this.scene.children.length > 0) {
        this.scene.children.forEach(child => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 0.3; // Уменьшаем общее освещение
          }
        });
      }
      
      // Обновляем цвета точек для лучшей видимости в темной теме
      if (this.geometry && this.material) {
        this.updateColorScheme(this.landscapeService.getCurrentSettings().colorScheme);
      }
    } else {
      // Светлая тема - светлый фон
      this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 200);
      this.renderer.setClearColor(0x000000, 0);
      
      // Восстанавливаем стандартное освещение для светлой темы
      if (this.scene.children.length > 0) {
        this.scene.children.forEach(child => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 0.6; // Стандартное освещение
          }
        });
      }
      
      // Обновляем цвета точек для светлой темы
      if (this.geometry && this.material) {
        this.updateColorScheme(this.landscapeService.getCurrentSettings().colorScheme);
      }
    }
  }
}
