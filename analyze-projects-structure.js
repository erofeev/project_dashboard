const fs = require('fs');

// Читаем данные проектов
const projectsData = JSON.parse(fs.readFileSync('projects_data.json', 'utf8'));

console.log('🌳 Структура проектов EasyRedmine:');
console.log('=' .repeat(60));

if (projectsData.projects && projectsData.projects.length > 0) {
  console.log(`📊 Всего проектов в системе: ${projectsData.total_count}`);
  console.log(`📋 Получено проектов: ${projectsData.projects.length}`);
  console.log('');

  // Функция для построения дерева проектов
  function buildProjectTree(projects) {
    const projectMap = new Map();
    const rootProjects = [];
    
    // Создаем карту всех проектов
    projects.forEach(project => {
      projectMap.set(project.id, {
        ...project,
        children: []
      });
    });
    
    // Строим дерево
    projects.forEach(project => {
      if (project.parent && project.parent.id) {
        const parent = projectMap.get(project.parent.id);
        if (parent) {
          parent.children.push(projectMap.get(project.id));
        }
      } else {
        rootProjects.push(projectMap.get(project.id));
      }
    });
    
    return rootProjects;
  }

  // Функция для отображения дерева проектов
  function displayProjectTree(projects, level = 0, prefix = '') {
    projects.forEach((project, index) => {
      const isLast = index === projects.length - 1;
      const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      
      // Статус проекта
      const statusText = project.status === 1 ? '🟢 Активен' : '🔴 Неактивен';
      
      // Тип проекта
      const projectType = project.custom_fields?.find(field => field.name === 'Project Type')?.value || 'Не указан';
      const practice = project.custom_fields?.find(field => field.name === 'Practice')?.value || 'Не указана';
      
      console.log(`${currentPrefix}${project.name} (ID: ${project.id})`);
      console.log(`${childPrefix}   Статус: ${statusText}`);
      console.log(`${childPrefix}   Тип: ${projectType}`);
      console.log(`${childPrefix}   Практика: ${practice}`);
      console.log(`${childPrefix}   Создан: ${new Date(project.created_on).toLocaleDateString('ru-RU')}`);
      
      if (project.description) {
        const cleanDesc = project.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
        if (cleanDesc) {
          console.log(`${childPrefix}   Описание: ${cleanDesc.substring(0, 80)}${cleanDesc.length > 80 ? '...' : ''}`);
        }
      }
      
      // Показываем дочерние проекты
      if (project.children && project.children.length > 0) {
        console.log(`${childPrefix}   📁 Подпроекты (${project.children.length}):`);
        displayProjectTree(project.children, level + 1, childPrefix);
      }
      
      console.log('');
    });
  }

  // Строим дерево проектов
  const projectTree = buildProjectTree(projectsData.projects);
  
  // Отображаем дерево
  displayProjectTree(projectTree);
  
  // Статистика по типам проектов
  console.log('📈 Статистика по типам проектов:');
  console.log('-'.repeat(40));
  
  const projectTypes = {};
  const practices = {};
  const departments = {};
  const regions = {};
  
  projectsData.projects.forEach(project => {
    const projectType = project.custom_fields?.find(field => field.name === 'Project Type')?.value || 'Не указан';
    const practice = project.custom_fields?.find(field => field.name === 'Practice')?.value || 'Не указана';
    const department = project.custom_fields?.find(field => field.name === 'Department')?.value || 'Не указан';
    const region = project.custom_fields?.find(field => field.name === 'Region')?.value || 'Не указан';
    
    projectTypes[projectType] = (projectTypes[projectType] || 0) + 1;
    practices[practice] = (practices[practice] || 0) + 1;
    departments[department] = (departments[department] || 0) + 1;
    regions[region] = (regions[region] || 0) + 1;
  });
  
  console.log('Типы проектов:');
  Object.entries(projectTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\nПрактики:');
  Object.entries(practices).sort((a, b) => b[1] - a[1]).forEach(([practice, count]) => {
    console.log(`  ${practice}: ${count}`);
  });
  
  console.log('\nДепартаменты:');
  Object.entries(departments).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
    console.log(`  ${dept}: ${count}`);
  });
  
  console.log('\nРегионы:');
  Object.entries(regions).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
  });
  
  // Анализ иерархии
  console.log('\n🌳 Анализ иерархии проектов:');
  console.log('-'.repeat(40));
  
  const projectsWithChildren = projectTree.filter(p => p.children.length > 0);
  const projectsWithoutChildren = projectTree.filter(p => p.children.length === 0);
  
  console.log(`Корневых проектов: ${projectTree.length}`);
  console.log(`Проектов с подпроектами: ${projectsWithChildren.length}`);
  console.log(`Проектов без подпроектов: ${projectsWithoutChildren.length}`);
  
  if (projectsWithChildren.length > 0) {
    console.log('\nПроекты с подпроектами:');
    projectsWithChildren.forEach(project => {
      console.log(`  ${project.name} (ID: ${project.id}) - ${project.children.length} подпроектов`);
    });
  }
  
} else {
  console.log('❌ Проекты не найдены или произошла ошибка');
  console.log('Ответ сервера:', JSON.stringify(projectsData, null, 2));
}
