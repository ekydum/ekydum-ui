import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ChannelComponent } from './components/channel/channel.component';
import { WatchComponent } from './components/watch/watch.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ManageComponent } from './components/manage/manage.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { FormsModule } from '@angular/forms';
import { EkydumPlayerComponent } from './components/shared/ekydum-player/ekydum-player.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SearchComponent } from './components/search/search.component';
import { PlaylistComponent } from './components/playlist/playlist.component';
import { StarredComponent } from './components/starred/starred.component';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    SubscriptionsComponent,
    ChannelComponent,
    PlaylistComponent,
    WatchComponent,
    SettingsComponent,
    ManageComponent,
    EkydumPlayerComponent,
    StarredComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes),
    BrowserModule,
    FormsModule,
    NgbModule,
  ],
  providers: [
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
