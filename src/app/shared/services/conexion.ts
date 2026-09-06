import { Service } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Service()
export class Conexion {
    private readonly STORAGE_KEY = 'app_online_mode';

    private isOnlineSubject = new BehaviorSubject<boolean>(this.getInitialState());

    private getInitialState(): boolean {
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        return savedState !== 'false';
    }

    isOnline$ = this.isOnlineSubject.asObservable();

    setOnlineMode(isOnline: boolean): void {
        localStorage.setItem(this.STORAGE_KEY, String(isOnline));
        this.isOnlineSubject.next(isOnline);
    }

    get isOnline(): boolean {
        return this.isOnlineSubject.value;
    }

}
