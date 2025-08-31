import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrimeNGComponent, ComponentExample, ComponentProperty, ComponentEvent, ComponentTemplate, ComponentCSSClass, ComponentDesignToken, ComponentDocumentation } from './types.js';

export class PrimeNGService {
  private baseUrl = 'https://primeng.org';
  private components: Map<string, PrimeNGComponent> = new Map();
  private initialized = false;

  // Список всех компонентов PrimeNG
  private readonly componentList = [
    // Form components
    { name: 'autocomplete', category: 'Form', url: '/autocomplete' },
    { name: 'cascadeselect', category: 'Form', url: '/cascadeselect' },
    { name: 'checkbox', category: 'Form', url: '/checkbox' },
    { name: 'colorpicker', category: 'Form', url: '/colorpicker' },
    { name: 'datepicker', category: 'Form', url: '/datepicker' },
    { name: 'editor', category: 'Form', url: '/editor' },
    { name: 'floatlabel', category: 'Form', url: '/floatlabel' },
    { name: 'iconfield', category: 'Form', url: '/iconfield' },
    { name: 'iftalabel', category: 'Form', url: '/iftalabel' },
    { name: 'inputgroup', category: 'Form', url: '/inputgroup' },
    { name: 'inputmask', category: 'Form', url: '/inputmask' },
    { name: 'inputnumber', category: 'Form', url: '/inputnumber' },
    { name: 'inputotp', category: 'Form', url: '/inputotp' },
    { name: 'inputtext', category: 'Form', url: '/inputtext' },
    { name: 'keyfilter', category: 'Form', url: '/keyfilter' },
    { name: 'knob', category: 'Form', url: '/knob' },
    { name: 'listbox', category: 'Form', url: '/listbox' },
    { name: 'multiselect', category: 'Form', url: '/multiselect' },
    { name: 'password', category: 'Form', url: '/password' },
    { name: 'radiobutton', category: 'Form', url: '/radiobutton' },
    { name: 'rating', category: 'Form', url: '/rating' },
    { name: 'select', category: 'Form', url: '/select' },
    { name: 'selectbutton', category: 'Form', url: '/selectbutton' },
    { name: 'slider', category: 'Form', url: '/slider' },
    { name: 'textarea', category: 'Form', url: '/textarea' },
    { name: 'togglebutton', category: 'Form', url: '/togglebutton' },
    { name: 'toggleswitch', category: 'Form', url: '/toggleswitch' },
    { name: 'treeselect', category: 'Form', url: '/treeselect' },
    
    // Button components
    { name: 'button', category: 'Button', url: '/button' },
    { name: 'speeddial', category: 'Button', url: '/speeddial' },
    { name: 'splitbutton', category: 'Button', url: '/splitbutton' },
    
    // Data components
    { name: 'dataview', category: 'Data', url: '/dataview' },
    { name: 'orderlist', category: 'Data', url: '/orderlist' },
    { name: 'orgchart', category: 'Data', url: '/orgchart' },
    { name: 'paginator', category: 'Data', url: '/paginator' },
    { name: 'picklist', category: 'Data', url: '/picklist' },
    { name: 'table', category: 'Data', url: '/table' },
    { name: 'timeline', category: 'Data', url: '/timeline' },
    { name: 'tree', category: 'Data', url: '/tree' },
    { name: 'treetable', category: 'Data', url: '/treetable' },
    { name: 'virtualscroller', category: 'Data', url: '/virtualscroller' },
    
    // Panel components
    { name: 'accordion', category: 'Panel', url: '/accordion' },
    { name: 'card', category: 'Panel', url: '/card' },
    { name: 'divider', category: 'Panel', url: '/divider' },
    { name: 'fieldset', category: 'Panel', url: '/fieldset' },
    { name: 'panel', category: 'Panel', url: '/panel' },
    { name: 'scrollpanel', category: 'Panel', url: '/scrollpanel' },
    { name: 'splitter', category: 'Panel', url: '/splitter' },
    { name: 'stepper', category: 'Panel', url: '/stepper' },
    { name: 'tabs', category: 'Panel', url: '/tabs' },
    { name: 'toolbar', category: 'Panel', url: '/toolbar' },
    
    // Overlay components
    { name: 'confirmdialog', category: 'Overlay', url: '/confirmdialog' },
    { name: 'confirmpopup', category: 'Overlay', url: '/confirmpopup' },
    { name: 'dialog', category: 'Overlay', url: '/dialog' },
    { name: 'drawer', category: 'Overlay', url: '/drawer' },
    { name: 'dynamicdialog', category: 'Overlay', url: '/dynamicdialog' },
    { name: 'popover', category: 'Overlay', url: '/popover' },
    { name: 'tooltip', category: 'Overlay', url: '/tooltip' },
    
    // Menu components
    { name: 'breadcrumb', category: 'Menu', url: '/breadcrumb' },
    { name: 'contextmenu', category: 'Menu', url: '/contextmenu' },
    { name: 'dock', category: 'Menu', url: '/dock' },
    { name: 'menu', category: 'Menu', url: '/menu' },
    { name: 'menubar', category: 'Menu', url: '/menubar' },
    { name: 'megamenu', category: 'Menu', url: '/megamenu' },
    { name: 'panelmenu', category: 'Menu', url: '/panelmenu' },
    { name: 'tieredmenu', category: 'Menu', url: '/tieredmenu' },
    
    // Other components
    { name: 'chart', category: 'Chart', url: '/chart' },
    { name: 'message', category: 'Messages', url: '/message' },
    { name: 'toast', category: 'Messages', url: '/toast' },
    { name: 'carousel', category: 'Media', url: '/carousel' },
    { name: 'galleria', category: 'Media', url: '/galleria' },
    { name: 'image', category: 'Media', url: '/image' },
    { name: 'imagecompare', category: 'Media', url: '/imagecompare' },
    { name: 'upload', category: 'File', url: '/upload' },
    
    // Misc components
    { name: 'avatar', category: 'Misc', url: '/avatar' },
    { name: 'badge', category: 'Misc', url: '/badge' },
    { name: 'blockui', category: 'Misc', url: '/blockui' },
    { name: 'chip', category: 'Misc', url: '/chip' },
    { name: 'inplace', category: 'Misc', url: '/inplace' },
    { name: 'metergroup', category: 'Misc', url: '/metergroup' },
    { name: 'progressbar', category: 'Misc', url: '/progressbar' },
    { name: 'progressspinner', category: 'Misc', url: '/progressspinner' },
    { name: 'scrolltop', category: 'Misc', url: '/scrolltop' },
    { name: 'skeleton', category: 'Misc', url: '/skeleton' },
    { name: 'tag', category: 'Misc', url: '/tag' },
    { name: 'terminal', category: 'Misc', url: '/terminal' }
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Инициализируем базовую информацию о компонентах
    for (const comp of this.componentList) {
      this.components.set(comp.name, {
        name: comp.name,
        category: comp.category,
        description: `PrimeNG ${comp.name} component`,
        url: `${this.baseUrl}${comp.url}`,
        apiUrl: `${this.baseUrl}${comp.url}#api`
      });
    }
    
    this.initialized = true;
  }

  async getComponent(name: string): Promise<PrimeNGComponent | null> {
    await this.initialize();
    return this.components.get(name.toLowerCase()) || null;
  }

  async getAllComponents(): Promise<PrimeNGComponent[]> {
    await this.initialize();
    return Array.from(this.components.values());
  }

  async getComponentsByCategory(category: string): Promise<PrimeNGComponent[]> {
    await this.initialize();
    return Array.from(this.components.values())
      .filter(comp => comp.category.toLowerCase() === category.toLowerCase());
  }

  async searchComponents(query: string): Promise<PrimeNGComponent[]> {
    await this.initialize();
    const searchTerm = query.toLowerCase();
    return Array.from(this.components.values())
      .filter(comp => 
        comp.name.toLowerCase().includes(searchTerm) ||
        comp.description.toLowerCase().includes(searchTerm) ||
        comp.category.toLowerCase().includes(searchTerm)
      );
  }

  async getComponentDocumentation(name: string): Promise<ComponentDocumentation | null> {
    const component = await this.getComponent(name);
    if (!component) return null;

    try {
      const response = await axios.get(component.url);
      const $ = cheerio.load(response.data);
      
      // Извлекаем документацию
      const fullDocumentation = this.extractDocumentation($);
      const codeExamples = this.extractCodeExamples($);
      const properties = this.extractProperties($);
      const events = this.extractEvents($);
      const templates = this.extractTemplates($);
      const cssClasses = this.extractCSSClasses($);
      const designTokens = this.extractDesignTokens($);
      const installation = this.extractInstallation($);
      const dependencies = this.extractDependencies($);

      return {
        component: {
          ...component,
          properties,
          events,
          templates,
          cssClasses,
          designTokens,
          examples: codeExamples
        },
        fullDocumentation,
        codeExamples,
        installation,
        dependencies
      };
    } catch (error) {
      console.error(`Error fetching documentation for ${name}:`, error);
      return null;
    }
  }

  private extractDocumentation($: cheerio.CheerioAPI): string {
    // Извлекаем основную документацию
    const sections = $('section, .doc-section, .content-section');
    let documentation = '';
    
    sections.each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        documentation += text + '\n\n';
      }
    });
    
    return documentation;
  }

  private extractCodeExamples($: cheerio.CheerioAPI): ComponentExample[] {
    const examples: ComponentExample[] = [];
    
    // Ищем блоки кода
    $('pre code, .code-section code').each((_, element) => {
      const code = $(element).text().trim();
      if (code && code.length > 10) {
        const title = $(element).closest('section').find('h1, h2, h3').first().text().trim() || 'Example';
        examples.push({
          title,
          code
        });
      }
    });
    
    return examples;
  }

  private extractProperties($: cheerio.CheerioAPI): ComponentProperty[] {
    const properties: ComponentProperty[] = [];
    
    // Ищем таблицы с properties
    $('table').each((_, table) => {
      const headers = $(table).find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      
      if (headers.includes('name') || headers.includes('property')) {
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 3) {
            const name = $(cells[0]).text().trim();
            const type = $(cells[1]).text().trim();
            const defaultValue = cells.length > 2 ? $(cells[2]).text().trim() : undefined;
            const description = cells.length > 3 ? $(cells[3]).text().trim() : '';
            
            if (name && type) {
              properties.push({
                name,
                type,
                default: defaultValue,
                description
              });
            }
          }
        });
      }
    });
    
    return properties;
  }

  private extractEvents($: cheerio.CheerioAPI): ComponentEvent[] {
    const events: ComponentEvent[] = [];
    
    // Ищем таблицы с events
    $('table').each((_, table) => {
      const headers = $(table).find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      
      if (headers.includes('event') || headers.some(h => h.includes('emit'))) {
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            const parameters = cells.length > 1 ? $(cells[1]).text().trim() : undefined;
            const description = cells.length > 2 ? $(cells[2]).text().trim() : '';
            
            if (name) {
              events.push({
                name,
                parameters,
                description
              });
            }
          }
        });
      }
    });
    
    return events;
  }

  private extractTemplates($: cheerio.CheerioAPI): ComponentTemplate[] {
    const templates: ComponentTemplate[] = [];
    
    // Ищем таблицы с templates
    $('table').each((_, table) => {
      const headers = $(table).find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      
      if (headers.includes('template')) {
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            const parameters = cells.length > 1 ? $(cells[1]).text().trim() : undefined;
            const description = cells.length > 2 ? $(cells[2]).text().trim() : '';
            
            if (name) {
              templates.push({
                name,
                parameters,
                description
              });
            }
          }
        });
      }
    });
    
    return templates;
  }

  private extractCSSClasses($: cheerio.CheerioAPI): ComponentCSSClass[] {
    const cssClasses: ComponentCSSClass[] = [];
    
    // Ищем таблицы с CSS классами
    $('table').each((_, table) => {
      const headers = $(table).find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      
      if (headers.includes('class')) {
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const className = $(cells[0]).text().trim();
            const description = $(cells[1]).text().trim();
            
            if (className) {
              cssClasses.push({
                class: className,
                description
              });
            }
          }
        });
      }
    });
    
    return cssClasses;
  }

  private extractDesignTokens($: cheerio.CheerioAPI): ComponentDesignToken[] {
    const designTokens: ComponentDesignToken[] = [];
    
    // Ищем таблицы с design tokens
    $('table').each((_, table) => {
      const headers = $(table).find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      
      if (headers.includes('token') || headers.includes('variable')) {
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 3) {
            const name = $(cells[0]).text().trim();
            const token = $(cells[1]).text().trim();
            const variable = $(cells[2]).text().trim();
            const description = cells.length > 3 ? $(cells[3]).text().trim() : '';
            
            if (name && token && variable) {
              designTokens.push({
                name,
                token,
                variable,
                description
              });
            }
          }
        });
      }
    });
    
    return designTokens;
  }

  private extractInstallation($: cheerio.CheerioAPI): string | undefined {
    // Ищем секции с установкой
    const installSection = $('h2:contains("Import"), h3:contains("Import")').next().text().trim();
    if (installSection) return installSection;
    
    const codeBlocks = $('pre code').map((_, el) => $(el).text().trim()).get();
    const importBlock = codeBlocks.find(code => code.includes('import') && code.includes('primeng'));
    
    return importBlock;
  }

  private extractDependencies($: cheerio.CheerioAPI): string[] {
    const dependencies: string[] = [];
    
    // Ищем упоминания зависимостей
    const text = $.text();
    if (text.includes('npm install quill')) {
      dependencies.push('quill');
    }
    if (text.includes('chart.js')) {
      dependencies.push('chart.js');
    }
    
    return dependencies;
  }

  async getCategories(): Promise<string[]> {
    await this.initialize();
    const categories = new Set<string>();
    this.components.forEach(comp => categories.add(comp.category));
    return Array.from(categories).sort();
  }

  async getComponentExample(name: string, exampleType?: string): Promise<ComponentExample | null> {
    const doc = await this.getComponentDocumentation(name);
    if (!doc || !doc.codeExamples.length) return null;
    
    if (exampleType) {
      return doc.codeExamples.find(ex => 
        ex.title.toLowerCase().includes(exampleType.toLowerCase())
      ) || doc.codeExamples[0];
    }
    
    return doc.codeExamples[0];
  }
}
