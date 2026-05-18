import { Routes } from '@angular/router';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ChannelComponent } from './components/channel/channel.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ManageComponent } from './components/manage/manage.component';
import { SearchComponent } from './components/search/search.component';
import { PlaylistComponent } from './components/playlist/playlist.component';
import { StarredComponent } from './components/starred/starred.component';
import { WatchLaterComponent } from './components/watch-later/watch-later.component';
import { QuickConnectComponent } from './components/quick-connect/quick-connect.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/subscriptions', pathMatch: 'full' },
  { path: 'quick-connect', component: QuickConnectComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'manage', component: ManageComponent },
  { path: 'search', component: SearchComponent, canActivate: [AuthGuard] },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: [AuthGuard] },
  { path: 'starred', component: StarredComponent, canActivate: [AuthGuard] },
  { path: 'watch-later', component: WatchLaterComponent, canActivate: [AuthGuard] },
  { path: 'channel/:id', component: ChannelComponent, canActivate: [AuthGuard] },
  { path: 'playlist/:id', component: PlaylistComponent, canActivate: [AuthGuard] }
];
