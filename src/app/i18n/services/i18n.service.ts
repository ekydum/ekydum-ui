import { Injectable, OnDestroy } from '@angular/core';
import { LANG_CODE } from '../models/lang-code.enum';
import { BehaviorSubject, map, Observable, Subject, takeUntil } from 'rxjs';
import { I18nDict, I18nLocalized } from '../models/dict.models';
import { ConfigService, CONFIG_KEYS } from '../../services/config.service';

@Injectable({ providedIn: 'root' })
export class I18nService implements OnDestroy {
  get lang(): LANG_CODE {
    return this.lang$.value;
  }

  readonly lang$ = new BehaviorSubject<LANG_CODE>(LANG_CODE.en);
  private readonly alive$ = new Subject<void>();

  constructor(private configService: ConfigService) {
    this.subscribeToConfigChanges();
  }

  ngOnDestroy(): void {
    this.alive$.next();
    this.alive$.complete();
  }

  private subscribeToConfigChanges(): void {
    this.configService.selectDistinct(CONFIG_KEYS.LANG).pipe(
      takeUntil(this.alive$)
    ).subscribe((langValue) => {
      if (langValue && Object.values(LANG_CODE).includes(langValue as LANG_CODE)) {
        this.lang$.next(langValue as LANG_CODE);
      }
    });
  }

  setLang(lang: LANG_CODE): void {
    this.lang$.next(lang);
    // Also update config service (which will persist to server)
    this.configService.set(CONFIG_KEYS.LANG, lang).subscribe();
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
    );
  }
}
