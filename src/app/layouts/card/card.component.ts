import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() content: string = '';
  @Input() value: string = ''; // Para valores numéricos grandes
  @Input() unit: string = ''; // Para unidades (PPM, dB, etc.)
  @Input() rightValue: string = ''; // Para valores alineados a la derecha
  @Input() rightSubtitle: string = ''; // Para subtítulos a la derecha
  @Input() showChart: boolean = false; // Para mostrar área de gráfico
  @Input() sensorType: string = ''; // Tipo de sensor
}
