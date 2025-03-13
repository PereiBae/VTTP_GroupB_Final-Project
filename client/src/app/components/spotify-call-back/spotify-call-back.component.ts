import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SpotifyService} from '../../services/spotify.service';

@Component({
  selector: 'app-spotify-call-back',
  standalone: false,
  templateUrl: './spotify-call-back.component.html',
  styleUrl: './spotify-call-back.component.css'
})
export class SpotifyCallBackComponent implements OnInit{

  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private spotifyService = inject(SpotifyService)

  ngOnInit(): void {
    // Get the code from the URL
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];

      if (error) {
        console.error('Spotify authentication error:', error);
        this.navigateBack();
        return;
      }

      if (code) {
        console.log('Received Spotify auth code, exchanging for token');
        this.spotifyService.exchangeCodeForToken(code).subscribe({
          next: () => {
            console.log('Token obtained successfully');
            this.navigateBack();
          },
          error: (err) => {
            console.error('Error exchanging code for token:', err);
            this.navigateBack();
          }
        });
      } else {
        this.navigateBack();
      }
    });
  }

  private navigateBack(): void {
    // Check if we have a saved entry ID to return to
    const entryId = sessionStorage.getItem('return_to_entry');
    if (entryId) {
      sessionStorage.removeItem('return_to_entry');
      this.router.navigate(['/diary', entryId]);
    } else {
      this.router.navigate(['/diary/new']);
    }
  }

}
