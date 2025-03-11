import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import {provideHttpClient} from '@angular/common/http';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import { MaterialModule } from './material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RegistrationComponent} from './components/registration/registration.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {AuthGuard} from './guards/auth.guard';
import {AlreadyLoggedInGuard} from './guards/already-logged-in.guard';
import {PremiumGuard} from './guards/premium.guard';
import {PremiumFeatureComponent} from './components/premium-feature/premium-feature.component';
import {UpgradeComponent} from './components/upgrade/upgrade.component';

const appRoutes: Routes = [
  {path: '', component: LoginComponent, canActivate: [AlreadyLoggedInGuard]},
  {path: 'register', component: RegistrationComponent, canActivate: [AlreadyLoggedInGuard]},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  {path: 'upgrade', component: UpgradeComponent, canActivate: [AuthGuard]},
  {path: 'statistics', component: PremiumFeatureComponent, canActivate: [PremiumGuard] },
  {path: '**', redirectTo: '/', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    DashboardComponent,
    PremiumFeatureComponent,
    UpgradeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    RouterModule.forRoot(appRoutes),
    MaterialModule,
    BrowserAnimationsModule
  ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule { }
