import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBar } from '@app/components/navBar/navBar';
import { LoaderComponent } from '@app/components/loader/loader';
import { TableComponent, TableColumn, TableRow } from '@components/table/table';
import { FeedsService, FeedData } from '@services/feeds/feeds.service';
import { firstValueFrom } from 'rxjs';
import{ActionsComponent} from '@components/actions/actions.component';

@Component({
  selector: 'app-air-quality',
  templateUrl: './air-quality.view.html',
  styleUrls: ['./air-quality.view.scss'],
  imports: [CommonModule, NavBar, LoaderComponent, TableComponent, ActionsComponent],
  standalone: true
})
export class AirQualityView implements OnInit, OnDestroy, AfterViewInit {
  columns: TableColumn[] = [
    { key: 'espacio', header: '', type: 'text', width: 60 },
    { key: 'index', header: '#', type: 'number', width: 60 },
    { key: 'created_at', header: 'Fecha', type: 'date', width: 220 },
    { key: 'value', header: 'Valor (PPM)', type: 'number', width: 140 },
    { key: 'id', header: 'ID', type: 'text', width: 320 }
  ];

  // Usa el mismo key en GET y DELETE:
  readonly feedKey = 'gas-sensor';
  rows: TableRow[] = [];
  private pollId: any;

  constructor(private feeds: FeedsService, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadRows();
      this.pollId = setInterval(() => this.loadRows(), 30000);
    }, 0);
  }
  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
  }

  private async loadRows() {
    try {
      const data: FeedData[] = await firstValueFrom(this.feeds.getFeedData(this.feedKey, 100));
      this.rows = (data ?? []).map((d, i) => ({
        index: i + 1,
        id: d.id,
        value: typeof d.value === 'number' ? d.value : parseFloat(d.value),
        created_at: new Date(d.created_at).toLocaleString(),
        rawData: d
      }));
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error loading gas-sensor data:', e);
      this.rows = [];
      this.cdr.detectChanges();
    }
  }

  async onEdit(row: TableRow) {
    try {
      await firstValueFrom(this.feeds.deleteDataPoint(this.feedKey, row.rawData.id));
      this.rows = this.rows.filter(r => r.rawData?.id !== row.rawData.id);
    } catch (error) {
      console.error('Error deleting air quality data:', error);
      // @ts-ignore
      console.error('Backend message:', (error as any)?.error);
    }
  }
}