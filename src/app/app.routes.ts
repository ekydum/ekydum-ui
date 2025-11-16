import { Routes } from '@angular/router';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ChannelComponent } from './components/channel/channel.component';
import { WatchComponent } from './components/watch/watch.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ManageComponent } from './components/manage/manage.component';
import { SearchComponent } from './components/search/search.component';
import { PlaylistComponent } from './components/playlist/playlist.component';
import { StarredComponent } from './components/starred/starred.component';
import { WatchLaterComponent } from './components/watch-later/watch-later.component';

export const routes: Routes = [
  { path: '', redirectTo: '/subscriptions', pathMatch: 'full' },
  { path: 'search', component: SearchComponent },
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'starred', component: StarredComponent },
  { path: 'watch-later', component: WatchLaterComponent },
  { path: 'channel/:id', component: ChannelComponent },
  { path: 'playlist/:id', component: PlaylistComponent },
  { path: 'watch/:id', component: WatchComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'manage', component: ManageComponent }
];
