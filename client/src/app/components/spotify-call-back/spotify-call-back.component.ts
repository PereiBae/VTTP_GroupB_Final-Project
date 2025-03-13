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

  ngOnInit() {
    // Get the code from the URL
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];

      if (error) {
        console.error('Spotify authentication error:', error);
        this.router.navigate(['/diary/new']);
        return;
      }

      if (code) {
        this.spotifyService.exchangeCodeForToken(code).subscribe({
          next: () => {
            // Redirect back to diary entry form
            this.router.navigate(['/diary/new']);
          },
          error: (err) => {
            console.error('Error exchanging code for token:', err);
            this.router.navigate(['/diary/new']);
          }
        });
      } else {
        this.router.navigate(['/diary/new']);
      }
    });
  }

}
