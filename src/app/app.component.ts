import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PocketbaseService } from './pocketbase.service';
import { lastValueFrom } from 'rxjs';
import { AuthMethodsList, AuthProviderInfo } from 'pocketbase';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  userRecords: any[] = [];
  authMethods?: AuthMethodsList;

  username = '';
  password = '';

  get loggedInUser() {
    return this.pbService.getAuthStore().model;
  }

  pbService = inject(PocketbaseService);

  async ngOnInit(): Promise<void> {
    await this.fetchRecords();
    await this.fetchAuthMethods();

    // Subscribe to changes in any users record
    this.pbService.getCollection('users').subscribe(
      '*',
      (e) => {
        console.log(e.action);
        console.log(e.record);

        // add record
        if (e.action === 'create') {
          console.log('User created:', e);
          this.userRecords.push(e.record);
        }
      },
      {
        /* other options like expand, custom headers, etc. */
      }
    );
  }

  ngOnDestroy(): void {
    this.pbService.getCollection('users').unsubscribe();
  }

  async login(provider: AuthProviderInfo) {
    await this.pbService
      .getCollection('users')
      .authWithOAuth2({ provider: provider.name });
    console.log('Auth token:', this.pbService.getAuthStore().token);
  }

  async signup() {
    try {
      const newUser = await this.pbService.getCollection('users').create({
        username: this.username,
        password: this.password,
        passwordConfirm: this.password, // Required to confirm password during creation
      });

      console.log('User created:', newUser);
    } catch (e) {
      console.log('User already exists');
    }

    // Log the user in
    const authData = await this.pbService
      .getCollection('users')
      .authWithPassword(this.username, this.password);
    console.log('User logged in:', authData);

    await this.fetchRecords();
  }

  logout() {
    this.pbService.getAuthStore().clear();
    console.log('logged out');
  }

  private async fetchRecords() {
    this.userRecords = (await this.pbService.getRecords('users')) as any[];
  }

  private async fetchAuthMethods() {
    this.authMethods = await this.pbService.getAuthMethods();
  }
}
