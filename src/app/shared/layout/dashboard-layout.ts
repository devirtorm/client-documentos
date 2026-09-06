import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from '../components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, BottomNav],
  template: `
    <router-outlet />
    <app-bottom-nav />
  `,
  host: {
    class: 'block min-h-screen pb-16',
  },
})
export class DashboardLayout {}
