import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AparienciaService } from './core/services/apariencia.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private apariencia: AparienciaService) {}

  ngOnInit() {
    this.apariencia.cargar();
  }
}
