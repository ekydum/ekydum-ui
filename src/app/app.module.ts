import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ChannelComponent } from './components/channel/channel.component';
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
import { WatchLaterComponent } from './components/watch-later/watch-later.component';
import { VideoItemComponent } from './components/shared/video-item/video-item.component';
import { QueueSidebarComponent } from './components/shared/queue-sidebar/queue-sidebar.component';
import { FloatingPlayerModalComponent } from './components/shared/floating-player-modal/floating-player-modal.component';
import { AppInitializerService } from './services/app-initializer.service';
import { QuickConnectComponent } from './components/quick-connect/quick-connect.component';
import { AboutModalComponent } from './components/about-modal/about-modal.component';
import { FeedComponent } from './components/feed/feed.component';

@NgModule({
  declarations: [
    AppComponent,
    FeedComponent,
    SearchComponent,
    SubscriptionsComponent,
    ChannelComponent,
    PlaylistComponent,
    SettingsComponent,
    ManageComponent,
    EkydumPlayerComponent,
    StarredComponent,
    WatchLaterComponent,
    VideoItemComponent,
    QueueSidebarComponent,
    FloatingPlayerModalComponent,
    QuickConnectComponent,
    AboutModalComponent,
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
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitializer: AppInitializerService) => () => appInitializer.initialize(),
      deps: [AppInitializerService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
