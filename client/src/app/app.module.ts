import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import {provideHttpClient} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import { MaterialModule } from './material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RegistrationComponent} from './components/registration/registration.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {AuthGuard} from './guards/auth.guard';
import {AlreadyLoggedInGuard} from './guards/already-logged-in.guard';
import {PremiumGuard} from './guards/premium.guard';
import {UpgradeComponent} from './components/upgrade/upgrade.component';
import {DiaryEntryComponent} from './components/diary/diary-entry/diary-entry.component';
import {DiaryListComponent} from './components/diary/diary-list/diary-list.component';
import {ExerciseSearchComponent} from './components/exercise/exercise-search/exercise-search.component';
import {NutritionFormComponent} from './components/nutrition/nutrition-form/nutrition-form.component';
import {NutritionListComponent} from './components/nutrition/nutrition-list/nutrition-list.component';
import {ProfileFormComponent} from './components/profile/profile-form/profile-form.component';
import {TemplateFormComponent} from './components/template/template-form/template-form.component';
import {TemplateListComponent} from './components/template/template-list/template-list.component';
import {StatisticComponent} from './components/statistics/statistic/statistic.component';
import {SpotifyCallBackComponent} from './components/spotify-call-back/spotify-call-back.component';
import {PaymentSuccessComponent} from './components/payments/payment-success/payment-success.component';
import {ChatComponent} from './components/chat/chat/chat.component';
import {PrimeNgModule} from './primeng.module';
import {
  ExerciseDetailsDialogComponent
} from './components/exercise/exercise-details-dialog/exercise-details-dialog.component';
import {
  TemplateSelectionDialogComponent
} from './components/exercise/template-selection-dialog/template-selection-dialog.component';

const appRoutes: Routes = [
  { path: '', component: LoginComponent, canActivate: [AlreadyLoggedInGuard]},
  { path: 'register', component: RegistrationComponent, canActivate: [AlreadyLoggedInGuard]},
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},

  // Diary routes
  { path: 'diary', component: DiaryListComponent, canActivate: [AuthGuard] },
  { path: 'diary/new', component: DiaryEntryComponent, canActivate: [AuthGuard] },
  { path: 'diary/:id', component: DiaryEntryComponent, canActivate: [AuthGuard] },
  { path: 'spotify-callback', component:SpotifyCallBackComponent},

  // Template routes
  { path: 'templates', component: TemplateListComponent, canActivate: [AuthGuard] },
  { path: 'templates/new', component: TemplateFormComponent, canActivate: [AuthGuard] },
  { path: 'templates/:id', component: TemplateFormComponent, canActivate: [AuthGuard] },

  // Exercise routes
  { path: 'exercises', component: ExerciseSearchComponent, canActivate: [AuthGuard] },

  // Profile routes
  { path: 'profile', component: ProfileFormComponent, canActivate: [AuthGuard] },

  // Social Route
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },

  // Payment Routes
  { path: 'payment/success', component: PaymentSuccessComponent, canActivate: [AuthGuard] },
  { path: 'payment/cancel', redirectTo: '/upgrade', pathMatch: 'full' },

  // Premium routes
  { path: 'upgrade', component: UpgradeComponent, canActivate: [AuthGuard] },
  { path: 'nutrition', component: NutritionListComponent, canActivate: [PremiumGuard] },
  { path: 'nutrition/new', component: NutritionFormComponent, canActivate: [PremiumGuard] },
  { path: 'nutrition/:id', component: NutritionFormComponent, canActivate: [PremiumGuard] },
  { path: 'statistics', component: StatisticComponent, canActivate: [PremiumGuard] },
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    DashboardComponent,
    UpgradeComponent,
    DiaryEntryComponent,
    DiaryListComponent,
    ExerciseSearchComponent,
    NutritionFormComponent,
    NutritionListComponent,
    ProfileFormComponent,
    TemplateFormComponent,
    TemplateListComponent,
    StatisticComponent,
    SpotifyCallBackComponent,
    PaymentSuccessComponent,
    ChatComponent,
    ExerciseDetailsDialogComponent,
    TemplateSelectionDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    RouterModule.forRoot(appRoutes, { useHash: true }),
    MaterialModule,
    BrowserAnimationsModule,
    FormsModule,
    PrimeNgModule
  ],
  providers: [provideHttpClient(),],
  bootstrap: [AppComponent]
})
export class AppModule { }
