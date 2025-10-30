import { Routes } from '@angular/router';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ChannelComponent } from './components/channel/channel.component';
import { WatchComponent } from './components/watch/watch.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ManageComponent } from './components/manage/manage.component';

export const routes: Routes = [
  { path: '', redirectTo: '/subscriptions', pathMatch: 'full' },
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'channel/:id', component: ChannelComponent },
  { path: 'watch/:id', component: WatchComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'manage', component: ManageComponent }
];
