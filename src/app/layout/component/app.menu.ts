import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Главная',
                items: [
                    { 
                        label: 'Дашборд', 
                        icon: 'pi pi-fw pi-home', 
                        routerLink: ['/'],
                        badge: 'NEW',
                        badgeClass: 'p-badge-success'
                    },
                    { 
                        label: 'Аналитика', 
                        icon: 'pi pi-fw pi-chart-line', 
                        routerLink: ['/analytics'],
                        badge: '3',
                        badgeClass: 'p-badge-info'
                    },
                    { 
                        label: 'Обзор', 
                        icon: 'pi pi-fw pi-eye', 
                        routerLink: ['/overview'] 
                    }
                ]
            },
                               {
                       label: 'Проекты',
                       items: [
                           {
                               label: 'Все проекты',
                               icon: 'pi pi-fw pi-briefcase',
                               routerLink: ['/projects'],
                               disabled: true
                           },
                           {
                               label: 'Активные',
                               icon: 'pi pi-fw pi-play-circle',
                               routerLink: ['/projects/active'],
                               disabled: true
                           },
                           {
                               label: 'Завершенные',
                               icon: 'pi pi-fw pi-check-circle',
                               routerLink: ['/projects/completed'],
                               disabled: true
                           },
                           {
                               label: 'Архив',
                               icon: 'pi pi-fw pi-archive',
                               routerLink: ['/projects/archive'],
                               disabled: true
                           }
                       ]
                   },
            {
                label: 'Отчеты',
                items: [
                    { 
                        label: 'Временные записи', 
                        icon: 'pi pi-fw pi-clock', 
                        routerLink: ['/reports/time-entries'],
                        badge: '12',
                        badgeClass: 'p-badge-info'
                    },
                    { 
                        label: 'Excel-подобный анализ', 
                        icon: 'pi pi-fw pi-table', 
                        routerLink: ['/reports/excel-like'],
                        badge: 'NEW',
                        badgeClass: 'p-badge-success'
                    },
                    { 
                        label: 'Финансы', 
                        icon: 'pi pi-fw pi-dollar', 
                        routerLink: ['/reports/finance'] 
                    },
                    { 
                        label: 'Производительность', 
                        icon: 'pi pi-fw pi-chart-bar', 
                        routerLink: ['/reports/performance'] 
                    },
                    { 
                        label: 'Экспорт', 
                        icon: 'pi pi-fw pi-download', 
                        routerLink: ['/reports/export'] 
                    }
                ]
            },
                               {
                       label: 'Пользователи',
                       items: [
                           {
                               label: 'Все пользователи',
                               icon: 'pi pi-fw pi-users',
                               routerLink: ['/users'],
                               disabled: true
                           },
                           {
                               label: 'Роли и права',
                               icon: 'pi pi-fw pi-shield',
                               routerLink: ['/users/roles'],
                               disabled: true
                           },
                           {
                               label: 'Активность',
                               icon: 'pi pi-fw pi-history',
                               routerLink: ['/users/activity'],
                               disabled: true
                           }
                       ]
                   },
            {
                label: 'Настройки',
                items: [
                    { 
                        label: 'Общие', 
                        icon: 'pi pi-fw pi-cog', 
                        routerLink: ['/settings'] 
                    },
                    { 
                        label: 'Интеграции', 
                        icon: 'pi pi-fw pi-link', 
                        routerLink: ['/settings/integrations'] 
                    },
                    { 
                        label: 'Уведомления', 
                        icon: 'pi pi-fw pi-bell', 
                        routerLink: ['/settings/notifications'] 
                    },
                    { 
                        label: 'Безопасность', 
                        icon: 'pi pi-fw pi-lock', 
                        routerLink: ['/settings/security'] 
                    }
                ]
            },
            {
                label: 'Синхронизация',
                items: [
                    { 
                        label: 'EasyRedmine', 
                        icon: 'pi pi-fw pi-sync', 
                        routerLink: ['/sync/erm'],
                        badge: 'NEW',
                        badgeClass: 'p-badge-success'
                    },
                    { 
                        label: 'Статус', 
                        icon: 'pi pi-fw pi-info-circle', 
                        routerLink: ['/sync/status'] 
                    },
                    { 
                        label: 'Логи', 
                        icon: 'pi pi-fw pi-file-text', 
                        routerLink: ['/sync/logs'] 
                    }
                ]
            },
            {
                label: 'UI Components',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                    { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                    { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                    { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                    { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                    { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                    { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                    { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                    { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
                    { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/pages/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    }
                ]
            },
            {
                label: 'Hierarchy',
                items: [
                    {
                        label: 'Submenu 1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 1.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 1.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 2.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 2.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/documentation']
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }
}
