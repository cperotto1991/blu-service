import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookie',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie.component.html',
  styleUrl: './cookie.component.scss',
})
export class CookieComponent {}
