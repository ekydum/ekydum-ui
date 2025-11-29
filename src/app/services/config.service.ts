import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, map, takeUntil, tap, filter } from 'rxjs';
import { ApiService } from './api.service';

export interface ConfigEntry {
  key: string;
  value: string;
}

// Known config keys
export const CONFIG_KEYS = {
  LANG: 'LANG',
  DEFAULT_QUALITY: 'DEFAULT_QUALITY',
  RELAY_PROXY_THUMBNAILS: 'RELAY_PROXY_THUMBNAILS',
} as const;

export type ConfigKey = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

@Injectable({ providedIn: 'root' })
export class ConfigService implements OnDestroy {
  private readonly config$ = new BehaviorSubject<Map<string, string>>(new Map());
  private readonly alive$ = new Subject<void>();
  private initialized = false;

  constructor(private api: ApiService) {}

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  /**
   * Initialize config from server. Call once at app startup or after login.
   */
  init(): Observable<Map<string, string>> {
    return this.api.getSettings().pipe(
      takeUntil(this.alive$),
      map((response) => {
        var settings: ConfigEntry[] = response?.settings || [];
        var configMap = new Map<string, string>();
        settings.forEach((s) => {
          configMap.set(s.key, s.value);
        });
        return configMap;
      }),
      tap((configMap) => {
        this.config$.next(configMap);
        this.initialized = true;
      })
    );
  }

  /**
   * Check if config has been loaded
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current value for a key (synchronous)
   */
  get(key: ConfigKey | string): string | undefined {
    return this.config$.value.get(key);
  }

  /**
   * Get current value with default fallback (synchronous)
   */
  getOrDefault(key: ConfigKey | string, defaultValue: string): string {
    return this.config$.value.get(key) ?? defaultValue;
  }

  /**
   * Subscribe to a specific config key changes.
   * Emits current value immediately, then on every change.
   */
  select(key: ConfigKey | string): Observable<string | undefined> {
    return this.config$.pipe(
      takeUntil(this.alive$),
      map((configMap) => configMap.get(key))
    );
  }

  /**
   * Subscribe to a specific config key with default value.
   * Never emits undefined.
   */
  selectOrDefault(key: ConfigKey | string, defaultValue: string): Observable<string> {
    return this.config$.pipe(
      takeUntil(this.alive$),
      map((configMap) => configMap.get(key) ?? defaultValue)
    );
  }

  /**
   * Subscribe to changes of a specific key (only emits when value actually changes).
   */
  selectDistinct(key: ConfigKey | string): Observable<string | undefined> {
    var lastValue: string | undefined = undefined;
    return this.config$.pipe(
      takeUntil(this.alive$),
      map((configMap) => configMap.get(key)),
      filter((value) => {
        if (value !== lastValue) {
          lastValue = value;
          return true;
        }
        return false;
      })
    );
  }

  /**
   * Get all config as observable
   */
  selectAll(): Observable<Map<string, string>> {
    return this.config$.asObservable().pipe(takeUntil(this.alive$));
  }

  /**
   * Get all config as plain object (synchronous)
   */
  getAll(): Record<string, string> {
    var result: Record<string, string> = {};
    this.config$.value.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Update a config value locally and persist to server.
   * Returns observable that completes on success.
   */
  set(key: ConfigKey | string, value: string): Observable<void> {
    // Update local state immediately (optimistic update)
    var currentMap = new Map(this.config$.value);
    currentMap.set(key, value);
    this.config$.next(currentMap);

    // Persist to server
    return this.api.updateSetting(key, value).pipe(
      takeUntil(this.alive$),
      map(() => void 0),
      tap({
        error: () => {
          // Rollback on error (could implement, but for simplicity just log)
          console.error(`Failed to save config: ${key}=${value}`);
        }
      })
    );
  }

  /**
   * Update local state only (no server persist).
   * Useful when server already updated elsewhere.
   */
  setLocal(key: ConfigKey | string, value: string): void {
    var currentMap = new Map(this.config$.value);
    currentMap.set(key, value);
    this.config$.next(currentMap);
  }

  /**
   * Bulk update multiple config values and persist to server.
   */
  setMany(entries: ConfigEntry[]): Observable<void>[] {
    return entries.map((entry) => this.set(entry.key, entry.value));
  }

  /**
   * Reset config (e.g., on logout)
   */
  reset(): void {
    this.config$.next(new Map());
    this.initialized = false;
  }
}
