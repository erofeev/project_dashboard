/**
 * Глобальная конфигурация PrimeNG для приложения
 * ПРАВИЛО: Везде используем size="small" для компактности
 */
export const PRIMENG_GLOBAL_CONFIG = {
  // Размеры по умолчанию - всегда small
  defaultSize: 'small' as const,
  
  // Настройки компонентов
  components: {
    button: {
      size: 'small',
      severity: 'primary'
    },
    inputText: {
      size: 'small'
    },
    dropdown: {
      size: 'small'
    },
    calendar: {
      size: 'small'
    },
    multiSelect: {
      size: 'small'
    },
    table: {
      size: 'small',
      density: 'compact'
    },
    dialog: {
      size: 'small'
    },
    panel: {
      size: 'small'
    },
    card: {
      size: 'small'
    }
  },

  // Общие стили для компактности
  compactStyles: {
    padding: '0.5rem',
    margin: '0.25rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem'
  }
};

/**
 * Инициализация глобальной конфигурации PrimeNG
 */
export function initPrimeNGConfig(): void {
  // Базовая инициализация без типа PrimeNGConfig
  // Настройки применяются через CSS
}

/**
 * Хелпер для получения размера компонента (всегда small)
 */
export function getComponentSize(): 'small' {
  return PRIMENG_GLOBAL_CONFIG.defaultSize;
}

/**
 * Хелпер для получения конфигурации конкретного компонента
 */
export function getComponentConfig(componentName: keyof typeof PRIMENG_GLOBAL_CONFIG.components) {
  return PRIMENG_GLOBAL_CONFIG.components[componentName];
}
