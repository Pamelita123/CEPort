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
import { ActionsComponent } from '@components/actions/actions.component';
import { ModalService } from '@components/modal/modal.service';
import { ModalData } from '@components/modal/modal.model';
import { Validators } from '@angular/forms';
import { Alert } from '@components/alert/alert';

@Component({
  selector: 'app-clima',
  templateUrl: './clima.view.html',
  styleUrls: ['./clima.view.scss'],
  imports: [CommonModule, NavBar, LoaderComponent, TableComponent, ActionsComponent],
  standalone: true,
})
export class ClimaView implements OnInit, OnDestroy, AfterViewInit {
  columns: TableColumn[] = [
    { key: 'espacio', header: '', type: 'text', width: 60 },
    { key: 'index', header: '#', type: 'number', width: 60 },
    { key: 'created_at', header: 'Fecha', type: 'date', width: 220 },
    { key: 'value', header: 'Temperatura (°C)', type: 'number', width: 180 },
    { key: 'id', header: 'ID', type: 'text', width: 320 },
  ];

  rows: TableRow[] = [];
  private pollId: any;
  private readonly FEED_KEY = 'temperature';

  feedName: string | null = null; // NUEVO

  constructor(
    private feeds: FeedsService,
    private cdr: ChangeDetectorRef,
    private modal: ModalService,
    private alert: Alert
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const feed = await firstValueFrom(this.feeds.getFeed(this.FEED_KEY));
      this.feedName = feed?.name ?? null;
    } catch (e) {
      console.error('No se pudo cargar el nombre del sensor:', e);
    }
  }

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
      const data: FeedData[] = await firstValueFrom(
        this.feeds.getFeedData(this.FEED_KEY, 100)
      );
      this.rows = (data ?? []).map((d, i) => ({
        index: i + 1,
        id: d.id,
        value: typeof d.value === 'number' ? d.value : parseFloat(String(d.value)),
        created_at: new Date(d.created_at).toLocaleString(),
        rawData: d,
      }));
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error loading temperature data:', e);
      this.rows = [];
      this.cdr.detectChanges();
    }
  }

  async onEdit(row: TableRow) {
    const ref = this.modal.open({
      title: 'Editar punto de dato',
      confirmButtonText: 'Guardar',
      fields: [
        {
          name: 'value',
          label: 'Temperatura (°C)',
          type: 'number',
          initialValue: row?.rawData?.value ?? '',
          validators: [Validators.required],
        },
      ],
    } as ModalData);

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      const newValue = Number(result.value);
      if (Number.isNaN(newValue)) {
        this.alert.showError('Valor inválido.');
        return;
      }

      try {
        const updated = await firstValueFrom(
          this.feeds.updateDataPoint(this.FEED_KEY, row.rawData.id, newValue)
        );

        this.rows = this.rows.map((r) => {
          if (r.rawData?.id !== row.rawData.id) return r;
          const newVal =
            typeof updated.value === 'number'
              ? updated.value
              : parseFloat(String(updated.value));
          return {
            ...r,
            value: newVal,
            created_at: new Date(updated.created_at).toLocaleString(),
            rawData: { ...r.rawData, ...updated },
          };
        });

        this.cdr.detectChanges();
        this.alert.showSuccess('Registro actualizado.');
      } catch (e) {
        console.error('Error updating temperature data:', e);
        this.alert.showError('Error al actualizar el registro.');
      }
    });
  }

  async onDelete(row: TableRow) {
    try {
      await firstValueFrom(this.feeds.deleteDataPoint(this.FEED_KEY, row.rawData.id));
      this.rows = this.rows.filter((r) => r.rawData?.id !== row.rawData.id);
      this.cdr.detectChanges();
      this.alert.showSuccess('Registro eliminado.');
    } catch (error) {
      console.error('Error deleting temperature data:', error);
      this.alert.showError('Error al eliminar el registro.');
    }
  }
}
