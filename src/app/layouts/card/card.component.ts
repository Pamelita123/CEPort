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
  @Input() value: string = ''; 
  @Input() unit: string = ''; 
  @Input() rightValue: string = ''; 
  @Input() rightSubtitle: string = '';
  @Input() showChart: boolean = false; 
  @Input() sensorType: string = ''; 
}
