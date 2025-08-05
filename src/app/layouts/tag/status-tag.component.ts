import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-tag',
  templateUrl: './status-tag.component.html',
  styleUrls: ['./status-tag.component.scss']
})
export class StatusTagComponent {
  @Input() text: string = '';
}
