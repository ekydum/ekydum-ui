import { Injectable, OnDestroy } from '@angular/core';
import { LANG_CODE } from '../models/lang-code.enum';
import { BehaviorSubject, map, Observable, Subject, takeUntil, tap } from 'rxjs';
import { I18nDict, I18nLocalized } from '../models/dict.models';
import { ApiService } from '../../services/api.service';

export interface UserPreference {
  id: string;
  key: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class I18nService implements OnDestroy {
  get lang(): LANG_CODE {
    return this.lang$.value;
  }

  readonly lang$ = new BehaviorSubject<LANG_CODE>(LANG_CODE.en);
  private readonly alive$ = new Subject<void>();

  constructor(
    private readonly apiService: ApiService
  ) {
    this.loadLangFromSettings();
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  private loadLangFromSettings(): void {
    this.apiService.getSettings().pipe(
      takeUntil(this.alive$),
      map((r) => r.settings || []),
      tap((settings: UserPreference[]) => {
        var langPref = settings.find(s => s.key === 'LANG');
        if (langPref && Object.values(LANG_CODE).includes(langPref.value as LANG_CODE)) {
          this.lang$.next(langPref.value as LANG_CODE);
        }
      })
    ).subscribe();
  }

  setLang(lang: LANG_CODE): void {
    this.lang$.next(lang);
  }

  translate(dict: I18nDict): Observable<I18nLocalized> {
    return this.lang$.pipe(
      takeUntil(this.alive$),
      map((lang: LANG_CODE) => {
        var translated: Record<string, string> = {};
        Object.keys(dict).forEach((k) => {
          translated[k] = dict[k][lang] || dict[k][LANG_CODE.en];
        });
        return translated as I18nLocalized;
      })
    )
  }
}
