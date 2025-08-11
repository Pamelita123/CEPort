import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBar } from '@app/components/navBar/navBar';
import { LoaderComponent } from '@app/components/loader/loader';
import { TableComponent, TableColumn, TableRow } from '@components/table/table';
import { FeedsService, FeedData } from '@services/feeds/feeds.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-clima',
  templateUrl: './clima.view.html',
  styleUrls: ['./clima.view.scss'],
  imports: [CommonModule, NavBar, LoaderComponent, TableComponent],
  standalone: true,
})
export class ClimaView implements OnInit, OnDestroy, AfterViewInit {
  columns: TableColumn[] = [
    { key: 'espacio', header: '', type: 'text', width: 60 },
    { key: 'index', header: '#', type: 'number', width: 60 },
    { key: 'created_at', header: 'Fecha', type: 'date', width: 220 },
    { key: 'value', header: 'Valor (°C)', type: 'number', width: 140 },
    { key: 'id', header: 'ID', type: 'text', width: 320 },
  ];

  rows: TableRow[] = [];
  private pollId: any;

  constructor(private feeds: FeedsService, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    // no-op to avoid NG0100
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadTemperatureRows();
      this.pollId = setInterval(() => this.loadTemperatureRows(), 30000);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
  }

  private async loadTemperatureRows() {
    try {
      const data: FeedData[] = await firstValueFrom(
        this.feeds.getFeedData('temperature', 100)
      );

      this.rows = (data ?? []).map((d, i) => ({
        index: i + 1,
        id: d.id,
        value: typeof d.value === 'number' ? d.value : parseFloat(d.value),
        created_at: new Date(d.created_at).toLocaleString(),
        rawData: d,
      }));
      this.cdr.detectChanges(); // ensure the table re-renders now
    } catch (e) {
      console.error('Error loading temperature feed data:', e);
      this.rows = [];
      this.cdr.detectChanges();
    }
  }
}
